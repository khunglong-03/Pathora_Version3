using Application.Common;
using Application.Common.Constant;
using Application.Contracts.Booking;
using Application.Contracts.User;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Mails;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using Microsoft.Extensions.Configuration;

namespace Application.Features.BookingManagement.Supplier;

public sealed record CreateSupplierCommand(
    string SupplierCode,
    SupplierType SupplierType,
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? Note,
    Continent? PrimaryContinent) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Supplier];
}

public sealed class CreateSupplierCommandValidator : AbstractValidator<CreateSupplierCommand>
{
    public CreateSupplierCommandValidator()
    {
        RuleFor(x => x.SupplierCode)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        When(x => x.SupplierType == SupplierType.Accommodation || x.SupplierType == SupplierType.Transport, () =>
        {
            RuleFor(x => x.PrimaryContinent)
                .NotNull();

            RuleFor(x => x.PrimaryContinent!.Value)
                .IsInEnum()
                .When(x => x.PrimaryContinent.HasValue);
        });
    }
}

public sealed class CreateSupplierCommandHandler(
    ISupplierRepository supplierRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CreateSupplierCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateSupplierCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var existing = await supplierRepository.GetByCodeAsync(request.SupplierCode);
        if (existing is not null)
        {
            return Error.Conflict(
                ErrorConstants.Supplier.CodeExistsCode,
                ErrorConstants.Supplier.CodeExistsDescription.Resolve(lang));
        }

        var entity = SupplierEntity.Create(
            request.SupplierCode,
            request.SupplierType,
            request.Name,
            performedBy: "system",
            request.Phone,
            request.Email,
            request.Address,
            request.Note,
            continent: request.PrimaryContinent);

        await supplierRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return entity.Id;
    }
}

public sealed record UpdateSupplierCommand(
    Guid SupplierId,
    string SupplierCode,
    SupplierType SupplierType,
    string Name,
    string? Phone,
    string? Email,
    string? Address,
    string? Note,
    bool IsActive) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Supplier];
}

public sealed class UpdateSupplierCommandValidator : AbstractValidator<UpdateSupplierCommand>
{
    public UpdateSupplierCommandValidator()
    {
        RuleFor(x => x.SupplierId)
            .NotEmpty();

        RuleFor(x => x.SupplierCode)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);
    }
}

public sealed class UpdateSupplierCommandHandler(
    ISupplierRepository supplierRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<UpdateSupplierCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateSupplierCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var entity = await supplierRepository.GetByIdAsync(request.SupplierId);
        if (entity is null)
        {
            return Error.NotFound(
                ErrorConstants.Supplier.NotFoundCode,
                ErrorConstants.Supplier.NotFoundDescription.Resolve(lang));
        }

        var existing = await supplierRepository.GetByCodeAsync(request.SupplierCode);
        if (existing is not null && existing.Id != request.SupplierId)
        {
            return Error.Conflict(
                ErrorConstants.Supplier.CodeExistsCode,
                ErrorConstants.Supplier.CodeExistsDescription.Resolve(lang));
        }

        entity.Update(
            request.SupplierCode,
            request.SupplierType,
            request.Name,
            performedBy: "system",
            request.Phone,
            request.Email,
            request.Address,
            request.Note,
            continent: entity.Continent,
            isActive: request.IsActive);

        supplierRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record DeleteSupplierCommand(Guid SupplierId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Supplier];
}

public sealed class DeleteSupplierCommandHandler(
    ISupplierRepository supplierRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<DeleteSupplierCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteSupplierCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var entity = await supplierRepository.GetByIdAsync(request.SupplierId, cancellationToken);
        if (entity is null)
        {
            return Error.NotFound(
                ErrorConstants.Supplier.NotFoundCode,
                ErrorConstants.Supplier.NotFoundDescription.Resolve(lang));
        }

        entity.SoftDelete("system");
        supplierRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// CreateSupplierWithOwnerCommand — creates User + Supplier atomically
// ──────────────────────────────────────────────────────────────────────────────

public sealed record CreateSupplierWithOwnerCommand(
    string OwnerEmail,
    string OwnerFullName,
    string SupplierCode,
    SupplierType SupplierType,
    string SupplierName,
    string? Phone,
    string? Email,
    string? Address,
    string? Note,
    Continent? PrimaryContinent) : ICommand<ErrorOr<(Guid UserId, Guid SupplierId, string OwnerEmail)>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Supplier, CacheKey.User];
}

public sealed class CreateSupplierWithOwnerCommandValidator : AbstractValidator<CreateSupplierWithOwnerCommand>
{
    public CreateSupplierWithOwnerCommandValidator()
    {
        RuleFor(x => x.OwnerEmail)
            .NotEmpty().WithMessage(ValidationMessages.EmailRequired)
            .Matches(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
            .WithMessage(ValidationMessages.EmailInvalid);

        RuleFor(x => x.OwnerFullName)
            .NotEmpty().WithMessage(ValidationMessages.FullNameRequired);

        RuleFor(x => x.SupplierCode)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.SupplierName)
            .NotEmpty()
            .MaximumLength(200);

        When(x => x.SupplierType == SupplierType.Accommodation || x.SupplierType == SupplierType.Transport, () =>
        {
            RuleFor(x => x.PrimaryContinent)
                .NotNull();

            RuleFor(x => x.PrimaryContinent!.Value)
                .IsInEnum()
                .When(x => x.PrimaryContinent.HasValue);
        });
    }
}

public sealed class CreateSupplierWithOwnerCommandHandler(
    IUserRepository userRepository,
    ISupplierRepository supplierRepository,
    IRoleRepository roleRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IMailRepository mailRepository,
    IPasswordResetTokenRepository passwordResetTokenRepository,
    IConfiguration configuration,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CreateSupplierWithOwnerCommand, ErrorOr<(Guid UserId, Guid SupplierId, string OwnerEmail)>>
{
    public async Task<ErrorOr<(Guid UserId, Guid SupplierId, string OwnerEmail)>> Handle(
        CreateSupplierWithOwnerCommand request,
        CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;

        // 1. Check email uniqueness
        var isUnique = await userRepository.IsEmailUnique(request.OwnerEmail);
        if (!isUnique)
        {
            return Error.Conflict(
                ErrorConstants.User.DuplicateEmailCode,
                ErrorConstants.User.DuplicateEmailDescription.Resolve(lang));
        }

        // 2. Check supplier code uniqueness
        var existingCode = await supplierRepository.GetByCodeAsync(request.SupplierCode);
        if (existingCode is not null)
        {
            return Error.Conflict(
                ErrorConstants.Supplier.CodeExistsCode,
                ErrorConstants.Supplier.CodeExistsDescription.Resolve(lang));
        }

        // 3. Determine role ID from supplier type
        var roleName = request.SupplierType switch
        {
            SupplierType.Transport => "TransportProvider",
            SupplierType.Accommodation => "HotelServiceProvider",
            _ => "TransportProvider"
        };

        var roleResult = await roleRepository.FindByNameAsync(roleName);
        if (roleResult.IsError || roleResult.Value is null)
        {
            return Error.Failure("Supplier.InvalidRole", $"Role '{roleName}' not found.");
        }

        var roleId = roleResult.Value.Id;

        // 4. Create user with temp password — owner must reset via email link
        var tempPassword = Guid.NewGuid().ToString("N")[..8] + "A1!";
        var hashedPassword = passwordHasher.HashPassword(tempPassword);

        var userEntity = UserEntity.Create(
            request.OwnerEmail,
            request.OwnerFullName,
            request.OwnerEmail,
            hashedPassword,
            performedBy: "system",
            avatar: null,
            forcePasswordChange: true);

        Guid supplierId = default;

        // 5. Transaction: create user → assign role → create supplier → queue reset-email
        //    NOTE: userRepository.Create() calls SaveChangesAsync internally, which is fine as the
        //    first operation. All subsequent additions must NOT call SaveChangesAsync — we rely on
        //    ExecuteTransactionAsync's final SaveChangesAsync to persist everything atomically.
        await unitOfWork.ExecuteTransactionAsync(async () =>
        {
            // Create user (this calls SaveChangesAsync internally — OK as first op)
            await userRepository.Create(userEntity);

            // Assign role (AddUser only adds to context, no save)
            var roleAddResult = await roleRepository.AddUser(userEntity.Id, [roleId]);
            if (roleAddResult.IsError)
            {
                throw new Exception($"Failed to assign role '{roleName}': {string.Join(", ", roleAddResult.Errors.Select(e => e.Description))}");
            }

            var supplier = SupplierEntity.Create(
                request.SupplierCode,
                request.SupplierType,
                request.SupplierName,
                performedBy: "system",
                request.Phone,
                request.Email,
                request.Address,
                request.Note,
                continent: request.PrimaryContinent,
                ownerUserId: userEntity.Id);

            // AddAsync only adds to context — no SaveChangesAsync
            await supplierRepository.AddAsync(supplier);
            supplierId = supplier.Id;

            // 6. Generate password-reset token and queue email so owner can set their password
            var resetToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            var tokenHash = passwordHasher.HashPassword(resetToken);
            var expiresAt = DateTimeOffset.UtcNow.AddHours(24);

            var resetTokenEntity = Domain.Entities.PasswordResetTokenEntity.Create(
                userEntity.Id.ToString(),
                tokenHash,
                expiresAt);

            // Add token directly without calling CreateAsync (which triggers SaveChangesAsync)
            await passwordResetTokenRepository.AddWithoutSaveAsync(resetTokenEntity);

            var frontendUrl = configuration["AppConfig:FrontendBaseUrl"]
                ?? throw new InvalidOperationException("AppConfig:FrontendBaseUrl is not configured.");

            var resetLink = $"{frontendUrl.TrimEnd('/')}/reset-password?token={resetToken}";

            var mailEntity = new Domain.Mails.MailEntity
            {
                To = request.OwnerEmail,
                Subject = "Password Reset",
                Body = System.Text.Json.JsonSerializer.Serialize(
                    new Domain.Mails.PasswordResetMail(resetLink, userEntity.Username ?? request.OwnerEmail, 24)),
                Template = nameof(Domain.Mails.PasswordResetMail),
            };

            // Add mail directly without calling Add (which triggers SaveChangesAsync)
            await mailRepository.AddWithoutSaveAsync(mailEntity);
        });

        return (userEntity.Id, supplierId, request.OwnerEmail);
    }
}
