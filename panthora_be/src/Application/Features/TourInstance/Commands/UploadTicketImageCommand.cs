using Application.Common.Authorization;
using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Contracts.File;
using Application.Features.TourInstance.DTOs;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;

namespace Application.Features.TourInstance.Commands;

/// <summary>
/// TourOperator/Manager upload ảnh vé ngoài cho activity vận chuyển (Flight/Train/Boat/Other).
/// Chỉ chạy được sau khi TourInstance đã có ít nhất một booking.
/// </summary>
public sealed record UploadTicketImageCommand(
    Guid InstanceId,
    Guid ActivityId,
    Stream FileStream,
    string FileName,
    string ContentType,
    long FileLength,
    Guid? BookingId,
    string? BookingReference,
    string? Note) : ICommand<ErrorOr<TicketImageDto>>;

public sealed class UploadTicketImageCommandValidator : AbstractValidator<UploadTicketImageCommand>
{
    public UploadTicketImageCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.ActivityId).NotEmpty();
        RuleFor(x => x.FileName).NotEmpty();
        RuleFor(x => x.FileLength).GreaterThan(0);
    }
}

public sealed class UploadTicketImageCommandHandler(
    ITourInstanceRepository tourInstanceRepository,
    IBookingRepository bookingRepository,
    ITicketImageRepository ticketImageRepository,
    IFileService fileService,
    IUnitOfWork unitOfWork,
    IUser user,
    ILanguageContext? languageContext = null
) : ICommandHandler<UploadTicketImageCommand, ErrorOr<TicketImageDto>>
{
    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB — keep aligned with frontend.

    public async Task<ErrorOr<TicketImageDto>> Handle(UploadTicketImageCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;

        if (string.IsNullOrWhiteSpace(user.Id))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription.Resolve(lang));

        var roleCheck = TourInstanceRoleGuard.Require(user, TourInstanceRoleGuard.ManagementRoles);
        if (roleCheck.IsError) return roleCheck.Errors;

        if (request.FileLength <= 0)
            return Error.Validation(TicketImageErrors.EmptyFileCode, TicketImageErrors.EmptyFileDescription.Resolve(lang));

        if (request.FileLength > MaxFileSizeBytes)
            return Error.Validation(TicketImageErrors.FileTooLargeCode, TicketImageErrors.FileTooLargeDescription.Resolve(lang));

        if (!AllowedMimeTypes.Contains(request.ContentType ?? string.Empty))
            return Error.Validation(TicketImageErrors.InvalidFileTypeCode, TicketImageErrors.InvalidFileTypeDescription.Resolve(lang));

        var instance = await tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId, cancellationToken);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription.Resolve(lang));

        var activity = instance.InstanceDays
            .SelectMany(d => d.Activities)
            .FirstOrDefault(a => a.Id == request.ActivityId);

        if (activity is null)
            return Error.NotFound(ErrorConstants.TourInstanceActivity.NotFoundCode, ErrorConstants.TourInstanceActivity.NotFoundDescription.Resolve(lang));

        if (activity.ActivityType != TourDayActivityType.Transportation
            || !activity.TransportationType.HasValue
            || activity.TransportationType.Value.GetApprovalCategory() != TransportApprovalCategory.ExternalTicket)
        {
            return Error.Validation(TicketImageErrors.ActivityNotExternalCode, TicketImageErrors.ActivityNotExternalDescription.Resolve(lang));
        }

        var bookingCount = await bookingRepository.CountByTourInstanceIdAsync(request.InstanceId, cancellationToken);
        if (bookingCount == 0)
            return Error.Validation(TicketImageErrors.NoBookingsCode, TicketImageErrors.NoBookingsDescription.Resolve(lang));

        if (request.BookingId.HasValue)
        {
            var booking = await bookingRepository.GetByIdAsync(request.BookingId.Value, cancellationToken);
            if (booking is null || booking.TourInstanceId != request.InstanceId)
                return Error.Validation(TicketImageErrors.NoBookingsCode, TicketImageErrors.NoBookingsDescription.Resolve(lang));
        }

        var meta = await fileService.UploadFileAsync(
            new UploadFileRequest(request.FileStream, request.FileName, request.ContentType ?? "application/octet-stream", request.FileLength));

        var image = ImageEntity.Create(
            fileId: meta.Id.ToString(),
            originalFileName: request.FileName,
            fileName: meta.Name,
            publicURL: meta.Url);

        var entity = TicketImageEntity.Create(
            tourInstanceDayActivityId: request.ActivityId,
            image: image,
            uploadedBy: user.Id!,
            bookingId: request.BookingId,
            bookingReference: string.IsNullOrWhiteSpace(request.BookingReference) ? null : request.BookingReference.Trim(),
            note: string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim());

        await ticketImageRepository.AddAsync(entity, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return new TicketImageDto(
            entity.Id,
            entity.TourInstanceDayActivityId,
            entity.Image.PublicURL,
            entity.Image.OriginalFileName,
            entity.UploadedBy,
            entity.UploadedAt,
            entity.BookingId,
            entity.BookingReference,
            entity.Note);
    }
}
