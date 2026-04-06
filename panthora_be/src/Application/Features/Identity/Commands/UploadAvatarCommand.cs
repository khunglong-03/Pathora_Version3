using Application.Common;
using Application.Common.Interfaces;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Logging;

namespace Application.Features.Identity.Commands;

public sealed record UploadAvatarCommand(
    Stream FileStream,
    string FileName,
    string ContentType,
    long FileSize,
    string CurrentUserId)
    : ICommand<ErrorOr<AvatarUploadResponse>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [$"{Common.CacheKey.User}:info:{CurrentUserId}"];
}

public sealed record AvatarUploadResponse(string AvatarUrl);

public sealed class UploadAvatarCommandHandler(
    IFileManager fileManager,
    IUnitOfWork unitOfWork,
    ILogger<UploadAvatarCommandHandler>? logger = null)
    : ICommandHandler<UploadAvatarCommand, ErrorOr<AvatarUploadResponse>>
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp"];
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5MB

    public async Task<ErrorOr<AvatarUploadResponse>> Handle(
        UploadAvatarCommand command,
        CancellationToken cancellationToken)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();

        if (!Guid.TryParse(command.CurrentUserId, out var userId))
        {
            sw.Stop();
            logger?.LogWarning(
                "UploadAvatar: invalid userId {UserId}, duration={DurationMs}ms",
                command.CurrentUserId, sw.ElapsedMilliseconds);
            return Error.Unauthorized("User.Unauthorized", "Invalid user identifier.");
        }

        // 1. Extension validation
        var ext = Path.GetExtension(command.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
        {
            sw.Stop();
            logger?.LogWarning(
                "UploadAvatar: invalid extension {Ext}, userId={UserId}, duration={DurationMs}ms",
                ext, userId, sw.ElapsedMilliseconds);
            return Error.Validation("Avatar.InvalidExtension", "Invalid file type. Only JPEG, PNG, and WebP are allowed.");
        }

        // 2. Content-type validation
        if (!AllowedContentTypes.Contains(command.ContentType.ToLowerInvariant()))
        {
            sw.Stop();
            logger?.LogWarning(
                "UploadAvatar: invalid content-type {ContentType}, userId={UserId}, duration={DurationMs}ms",
                command.ContentType, userId, sw.ElapsedMilliseconds);
            return Error.Validation("Avatar.InvalidContentType", "Invalid content type.");
        }

        // 3. Magic byte validation — read first bytes of the stream
        string? uploadedPublicId = null;
        try
        {
            command.FileStream.Position = 0;
            var headerBytes = new byte[12];
            var bytesRead = await command.FileStream.ReadAsync(headerBytes.AsMemory(), cancellationToken);
            command.FileStream.Position = 0;

            if (bytesRead < 4)
            {
                sw.Stop();
                logger?.LogWarning("UploadAvatar: file too small for magic byte check, userId={UserId}", userId);
                return Error.Validation("Avatar.FileTooSmall", "File is too small to be a valid image.");
            }

            // Check magic bytes
            var isValidMagicBytes = false;
            if (ext is ".jpg" or ".jpeg")
            {
                // JPEG: FF D8 FF
                isValidMagicBytes = headerBytes[0] == 0xFF && headerBytes[1] == 0xD8 && headerBytes[2] == 0xFF;
            }
            else if (ext == ".png")
            {
                // PNG: 89 50 4E 47
                isValidMagicBytes = headerBytes[0] == 0x89 && headerBytes[1] == 0x50 &&
                                    headerBytes[2] == 0x4E && headerBytes[3] == 0x47;
            }
            else if (ext == ".webp")
            {
                // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
                isValidMagicBytes = headerBytes[0] == 0x52 && headerBytes[1] == 0x49 && headerBytes[2] == 0x46 && headerBytes[3] == 0x46 &&
                                    headerBytes[8] == 0x57 && headerBytes[9] == 0x45 && headerBytes[10] == 0x42 && headerBytes[11] == 0x50;
            }

            if (!isValidMagicBytes)
            {
                sw.Stop();
                logger?.LogWarning("UploadAvatar: magic bytes mismatch, userId={UserId}", userId);
                return Error.Validation("Avatar.InvalidImage", "File content does not match declared image type.");
            }

            // 4. Polyglot scan — reject if file contains dangerous patterns
            // Read enough bytes for polyglot scan (up to 64KB)
            var scanBytes = new byte[Math.Min(bytesRead, 65536)];
            command.FileStream.Position = 0;
            var scanRead = await command.FileStream.ReadAsync(scanBytes.AsMemory(0, scanBytes.Length), cancellationToken);
            command.FileStream.Position = 0;
            var content = System.Text.Encoding.UTF8.GetString(scanBytes);

            if (content.Contains("<?php") || content.Contains("<script>") ||
                content.Contains("eval(") || content.Contains("<%") ||
                scanBytes.AsSpan().Slice(0, 2).SequenceEqual(new byte[] { 0x4D, 0x5A })) // MZ = PE/EXE header
            {
                sw.Stop();
                logger?.LogWarning("UploadAvatar: polyglot/payload detected, userId={UserId}", userId);
                return Error.Validation("Avatar.SuspiciousContent", "File contains suspicious content and was rejected.");
            }

            // 5. Max size validation
            if (command.FileSize > MaxFileSizeBytes)
            {
                sw.Stop();
                logger?.LogWarning(
                    "UploadAvatar: file too large {Size} > {MaxSize}, userId={UserId}",
                    command.FileSize, MaxFileSizeBytes, userId);
                return Error.Validation("Avatar.FileTooLarge", "File size exceeds 5MB limit.");
            }

            // 6. Upload to Cloudinary
            var uploadResult = await fileManager.UploadAvatarAsync(
                command.FileStream,
                command.FileName,
                cancellationToken);
            uploadedPublicId = uploadResult.PublicId;

            // 7. Update UserEntity.AvatarUrl in the same transaction
            await unitOfWork.ExecuteTransactionAsync(async () =>
            {
                var userRepo = unitOfWork.GenericRepository<Domain.Entities.UserEntity>();
                var userEntity = (await userRepo.GetListAsync(u => u.Id == userId)).FirstOrDefault();
                if (userEntity is not null)
                {
                    userEntity.UpdateProfile(
                        userEntity.FullName,
                        userEntity.PhoneNumber,
                        userEntity.Address,
                        uploadResult.Url);
                    userRepo.Update(userEntity);
                }
            });

            sw.Stop();
            logger?.LogInformation(
                "UploadAvatar: success userId={UserId}, fileSize={FileSize}, contentType={ContentType}, duration={DurationMs}ms",
                userId, command.FileSize, command.ContentType, sw.ElapsedMilliseconds);

            return new AvatarUploadResponse(uploadResult.Url);
        }
        catch (Exception ex)
        {
            sw.Stop();
            // Rollback: delete uploaded file if exists
            if (!string.IsNullOrEmpty(uploadedPublicId))
            {
                try
                {
                    await fileManager.DeleteUploadedFilesAsync([uploadedPublicId], cancellationToken);
                    logger?.LogInformation("UploadAvatar: rollback deleted publicId={PublicId}", uploadedPublicId);
                }
                catch (Exception rollbackEx)
                {
                    logger?.LogError(rollbackEx, "UploadAvatar: rollback failed for publicId={PublicId}", uploadedPublicId);
                }
            }

            logger?.LogError(ex,
                "UploadAvatar: failure userId={UserId}, error={Error}, duration={DurationMs}ms",
                userId, ex.Message, sw.ElapsedMilliseconds);
            return Error.Failure("Avatar.UploadFailed", "Failed to upload avatar.");
        }
    }
}
