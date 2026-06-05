using Contracts.Interfaces;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using Application.Common;
using Application.Common.Interfaces;
using Application.Services;
using FluentValidation;
using MediatR;
using System.Text.Json.Serialization;

namespace Application.Features.VisaApplication.Commands;
// Create
public sealed record CreateVisaApplicationCommand(
    [property: JsonPropertyName("bookingParticipantId")] Guid BookingParticipantId,
    [property: JsonPropertyName("passportId")] Guid PassportId,
    [property: JsonPropertyName("destinationCountry")] string DestinationCountry,
    [property: JsonPropertyName("minReturnDate")] DateTimeOffset? MinReturnDate = null,
    [property: JsonPropertyName("visaFileUrl")] string? VisaFileUrl = null) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking, CacheKey.Admin];
}

public sealed class CreateVisaApplicationCommandValidator : AbstractValidator<CreateVisaApplicationCommand>
{
    public CreateVisaApplicationCommandValidator()
    {
        RuleFor(x => x.BookingParticipantId).NotEmpty();
        RuleFor(x => x.PassportId).NotEmpty();
        RuleFor(x => x.DestinationCountry).NotEmpty().MaximumLength(100);
    }
}

public sealed class CreateVisaApplicationCommandHandler(
    IVisaApplicationRepository repository,
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : IRequestHandler<CreateVisaApplicationCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateVisaApplicationCommand request, CancellationToken cancellationToken)
    {
        var entity = VisaApplicationEntity.Create(
            request.BookingParticipantId,
            request.PassportId,
            request.DestinationCountry,
            "system",
            request.MinReturnDate?.ToUniversalTime(),
            request.VisaFileUrl
        );

        await repository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync();
        return entity.Id;
    }
}

// UpdateStatus
public sealed record UpdateVisaApplicationStatusCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("status")] VisaStatus Status,
    [property: JsonPropertyName("refusalReason")] string? RefusalReason = null,
    [property: JsonPropertyName("visaFileUrl")] string? VisaFileUrl = null,
    [property: JsonPropertyName("visaNumber")] string? VisaNumber = null,
    [property: JsonPropertyName("entryType")] VisaEntryType? EntryType = null,
    [property: JsonPropertyName("issuedAt")] DateTimeOffset? IssuedAt = null,
    [property: JsonPropertyName("expiresAt")] DateTimeOffset? ExpiresAt = null,
    [property: JsonPropertyName("category")] VisaCategory? Category = null,
    [property: JsonPropertyName("format")] VisaFormat? Format = null,
    [property: JsonPropertyName("maxStayDays")] int? MaxStayDays = null,
    [property: JsonPropertyName("issuingAuthority")] string? IssuingAuthority = null) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking, CacheKey.Admin, CacheKey.TourInstance];
}

public sealed class UpdateVisaApplicationStatusCommandValidator : AbstractValidator<UpdateVisaApplicationStatusCommand>
{
    public UpdateVisaApplicationStatusCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.RefusalReason)
            .NotEmpty()
            .WithMessage("Rejection reason is required.")
            .MinimumLength(5)
            .WithMessage("Rejection reason must be at least 5 characters.")
            .When(x => x.Status == VisaStatus.Rejected);
    }
}

public sealed class UpdateVisaApplicationStatusCommandHandler(
    IVisaApplicationRepository repository,
    IVisaRepository visaRepository,
    ICurrentUser currentUser,
    IPostPaymentVisaGateService visaGateService,
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateVisaApplicationStatusCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateVisaApplicationStatusCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = currentUser.Id;
        if (currentUserId == null)
            return Error.Unauthorized("User.Unauthorized", "User is not authenticated.");

        var entity = await repository.GetByIdWithGraphAsync(request.Id, cancellationToken);
        if (entity is null)
            return Error.NotFound("Visa application not found.");

        var tourInstance = entity.BookingParticipant?.Booking?.TourInstance;
        if (tourInstance == null)
            return Error.NotFound("TourInstance.NotFound", "TourInstance không tồn tại.");

        if (!currentUser.IsInRole(Application.Common.Constant.RoleConstants.Admin) && !currentUser.IsInRole(Application.Common.Constant.RoleConstants.Manager))
        {
            if (currentUser.IsInRole(Application.Common.Constant.RoleConstants.TourOperator))
                return Error.Forbidden("Visa.Forbidden", "Tour Operator không được duyệt/từ chối visa.");

            var isManager = tourInstance.Managers.Any(m => m.UserId == currentUserId);
            if (!isManager)
                return Error.Forbidden("Visa.Forbidden", "Bạn không có quyền thao tác trên tour này.");
        }

        if (request.Status == VisaStatus.Rejected)
        {
            // Chỉ chặn reject khi tour đã chạy/kết thúc/huỷ — các state trước đó (PendingVisa, Confirmed,
            // Available, SoldOut, PendingApproval, Draft, PendingAdjustment, PendingManagerReview,
            // PendingCustomerApproval) đều cho phép manager rollback visa decision.
            var blockedStatuses = new[]
            {
                TourInstanceStatus.InProgress,
                TourInstanceStatus.Completed,
                TourInstanceStatus.Cancelled
            };
            if (blockedStatuses.Contains(tourInstance.Status))
            {
                return Error.Conflict("Visa.CannotReject", "Không thể từ chối visa khi tour đã bắt đầu, hoàn tất hoặc đã huỷ.");
            }
        }

        if (request.Status == VisaStatus.Approved)
        {
            var passport = entity.Passport;
            if (passport == null || !passport.ExpiresAt.HasValue || passport.ExpiresAt.Value.Date < tourInstance.StartDate.Date)
                return Error.Validation("Visa.InvalidPassport", "Hộ chiếu chưa có hoặc đã hết hạn trước khi tour bắt đầu.");

            if (entity.Visa != null)
            {
                entity.Visa.Update(
                    performedBy: currentUserId.Value.ToString(),
                    visaNumber: request.VisaNumber ?? entity.Visa.VisaNumber,
                    entryType: request.EntryType ?? entity.Visa.EntryType,
                    issuedAt: request.IssuedAt?.ToUniversalTime() ?? entity.Visa.IssuedAt,
                    expiresAt: request.ExpiresAt?.ToUniversalTime() ?? entity.Visa.ExpiresAt,
                    destinationCountry: entity.DestinationCountry,
                    category: request.Category ?? entity.Visa.Category,
                    format: request.Format ?? entity.Visa.Format,
                    maxStayDays: request.MaxStayDays ?? entity.Visa.MaxStayDays,
                    issuingAuthority: request.IssuingAuthority ?? entity.Visa.IssuingAuthority,
                    status: VisaStatus.Approved,
                    fileUrl: request.VisaFileUrl ?? entity.Visa.FileUrl);
            }
            else
            {
                var visa = VisaEntity.Create(
                    visaApplicationId: entity.Id,
                    performedBy: currentUserId.Value.ToString(),
                    visaNumber: request.VisaNumber,
                    entryType: request.EntryType,
                    issuedAt: request.IssuedAt?.ToUniversalTime(),
                    expiresAt: request.ExpiresAt?.ToUniversalTime(),
                    destinationCountry: entity.DestinationCountry,
                    category: request.Category,
                    format: request.Format,
                    maxStayDays: request.MaxStayDays,
                    issuingAuthority: request.IssuingAuthority,
                    fileUrl: request.VisaFileUrl,
                    status: VisaStatus.Approved);
                await visaRepository.AddAsync(visa, cancellationToken);
                entity.Visa = visa;
            }
        }
        else if (request.Status == VisaStatus.Rejected)
        {
            if (string.IsNullOrWhiteSpace(request.RefusalReason))
                return Error.Validation("Visa.RefusalReasonRequired", "Bắt buộc phải nhập lý do từ chối.");

            if (entity.Visa != null)
            {
                entity.Visa.Update(
                    performedBy: currentUserId.Value.ToString(),
                    visaNumber: entity.Visa.VisaNumber,
                    entryType: entity.Visa.EntryType,
                    issuedAt: entity.Visa.IssuedAt,
                    expiresAt: entity.Visa.ExpiresAt,
                    destinationCountry: entity.Visa.DestinationCountry,
                    category: entity.Visa.Category,
                    format: entity.Visa.Format,
                    maxStayDays: entity.Visa.MaxStayDays,
                    issuingAuthority: entity.Visa.IssuingAuthority,
                    status: VisaStatus.Rejected,
                    fileUrl: entity.Visa.FileUrl);
            }
        }

        entity.Update(
            entity.DestinationCountry,
            currentUserId.Value.ToString(),
            request.Status,
            entity.MinReturnDate,
            request.RefusalReason?.Trim(),
            request.VisaFileUrl ?? entity.VisaFileUrl
        );

        // Cascade: nếu reject visa sau khi tour đã CompleteVisaGate (Status=Confirmed),
        // revert tour về PendingVisa để manager xử lý lại visa cho participant này.
        if (request.Status == VisaStatus.Rejected
            && tourInstance.Status == TourInstanceStatus.Confirmed
            && tourInstance.InstanceType == TourType.Private)
        {
            try
            {
                tourInstance.RevertVisaGate(currentUserId.Value.ToString());
            }
            catch (InvalidOperationException)
            {
                // Không revert được (state không hợp lệ) → bỏ qua, không chặn reject.
            }
        }

        repository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        // 4.7: Sau khi save thành công, kiểm tra hoàn tất Visa Gate
        if (entity.BookingParticipant?.BookingId != null)
        {
            var bookingId = entity.BookingParticipant.BookingId;
            _ = Task.Run(() => visaGateService.TryCompleteVisaGateAsync(bookingId, default));
        }

        return Result.Success;
    }
}

// ─── Quote Visa Support Fee ──────────────────────────────────────────────────

public sealed record QuoteVisaSupportFeeCommand(
    Guid VisaApplicationId,
    decimal Fee)
    : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking, CacheKey.Admin];
}

public sealed class QuoteVisaSupportFeeCommandHandler(
    IVisaApplicationRepository visaRepository,
    IPaymentService paymentService,
    ICurrentUser currentUser,
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : IRequestHandler<QuoteVisaSupportFeeCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(QuoteVisaSupportFeeCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = currentUser.Id;
        if (currentUserId == null)
            return Error.Unauthorized("User.Unauthorized", "User is not authenticated.");

        var visaApp = await visaRepository.GetByIdWithGraphAsync(request.VisaApplicationId, cancellationToken);
        if (visaApp == null)
            return Error.NotFound("Visa.NotFound", "Đơn visa không tồn tại.");

        var tourInstance = visaApp.BookingParticipant?.Booking?.TourInstance;
        if (tourInstance == null)
            return Error.NotFound("TourInstance.NotFound", "TourInstance không tồn tại.");

        if (!currentUser.IsInRole(Application.Common.Constant.RoleConstants.Admin) && !currentUser.IsInRole(Application.Common.Constant.RoleConstants.Manager))
        {
            var isManager = tourInstance.Managers.Any(m => m.UserId == currentUserId);
            if (!isManager)
                return Error.Forbidden("Visa.Forbidden", "Bạn không có quyền thao tác trên tour này.");
        }

        if (!visaApp.IsSystemAssisted)
            return Error.Validation("Visa.NotSystemAssisted", "Chỉ áp dụng báo giá phí cho đơn có yêu cầu hỗ trợ từ hệ thống.");

        if (visaApp.ServiceFeeTransactionId.HasValue)
        {
            // Nếu đã quote rồi thì trả lại transaction cũ
            return visaApp.ServiceFeeTransactionId.Value;
        }

        var booking = visaApp.BookingParticipant!.Booking;
        if (booking == null)
            return Error.NotFound("Booking.NotFound", "Booking không tồn tại.");

        var performedBy = currentUserId.Value.ToString();

        // 1. Tạo transaction qua PaymentService (QR, refCode, outbox polling)
        var transactionResult = await paymentService.CreatePaymentTransactionAsync(
            bookingId: booking.Id,
            type: TransactionType.VisaServiceFee,
            amount: request.Fee,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: $"Visa support fee for participant {visaApp.BookingParticipantId}",
            createdBy: performedBy);

        if (transactionResult.IsError)
            return transactionResult.Errors;

        var transaction = transactionResult.Value;

        // 2. Add VisaServiceFeeTotal vào booking (nhưng không đổi status)
        // booking & visaApp đã tracked qua GetByIdWithGraphAsync — EF tự detect mutation,
        // không gọi DbSet.Update() để tránh xung đột re-attach graph.
        booking.AddVisaServiceFee(request.Fee, performedBy);

        // 3. Set service fee reference cho application
        visaApp.QuoteServiceFee(request.Fee, transaction.Id, performedBy);

        await unitOfWork.SaveChangeAsync(cancellationToken);

        return transaction.Id;
    }
}

// ─── Register Visa Details (Manager) ─────────────────────────────────────────
// Manager đăng ký thông tin visa sau khi customer đã thanh toán phí dịch vụ.
// Gate: visaApp.IsSystemAssisted && visaApp.ServiceFeePaidAt != null.
// Không đổi status visaApp (vẫn Processing); VisaEntity child status = Pending,
// sau đó manager approve riêng qua UpdateVisaApplicationStatusCommand.

public sealed record RegisterVisaDetailsCommand(
    [property: JsonPropertyName("visaApplicationId")] Guid VisaApplicationId,
    [property: JsonPropertyName("visaNumber")] string VisaNumber,
    [property: JsonPropertyName("issuedAt")] DateTimeOffset IssuedAt,
    [property: JsonPropertyName("expiresAt")] DateTimeOffset ExpiresAt,
    [property: JsonPropertyName("category")] VisaCategory? Category = null,
    [property: JsonPropertyName("format")] VisaFormat? Format = null,
    [property: JsonPropertyName("destinationCountry")] string? DestinationCountry = null,
    [property: JsonPropertyName("entryType")] VisaEntryType? EntryType = null,
    [property: JsonPropertyName("maxStayDays")] int? MaxStayDays = null,
    [property: JsonPropertyName("issuingAuthority")] string? IssuingAuthority = null,
    [property: JsonPropertyName("visaFileUrl")] string? VisaFileUrl = null,
    [property: JsonPropertyName("serviceFee")] decimal? ServiceFee = null)
    : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking, CacheKey.Admin];
}

public sealed class RegisterVisaDetailsCommandValidator : AbstractValidator<RegisterVisaDetailsCommand>
{
    public RegisterVisaDetailsCommandValidator()
    {
        RuleFor(x => x.VisaApplicationId).NotEmpty();
        RuleFor(x => x.VisaNumber).NotEmpty().MaximumLength(64);
        RuleFor(x => x.IssuedAt).NotEmpty();
        RuleFor(x => x.ExpiresAt).NotEmpty()
            .GreaterThan(x => x.IssuedAt)
            .WithMessage("ExpiresAt phải lớn hơn IssuedAt.");
        RuleFor(x => x.Category).IsInEnum().When(x => x.Category.HasValue);
        RuleFor(x => x.Format).IsInEnum().When(x => x.Format.HasValue);
        RuleFor(x => x.DestinationCountry)
            .Length(2, 3)
            .Matches("^[A-Z]+$")
            .WithMessage("Quốc gia đến phải từ 2 đến 3 ký tự viết hoa.")
            .When(x => !string.IsNullOrWhiteSpace(x.DestinationCountry));
        RuleFor(x => x.EntryType).IsInEnum().When(x => x.EntryType.HasValue);
        RuleFor(x => x.MaxStayDays).GreaterThan(0).When(x => x.MaxStayDays.HasValue);
        RuleFor(x => x.IssuingAuthority).MaximumLength(200);
        RuleFor(x => x.ServiceFee).GreaterThanOrEqualTo(0).When(x => x.ServiceFee.HasValue);
    }
}

public sealed class RegisterVisaDetailsCommandHandler(
    IVisaApplicationRepository visaRepository,
    IVisaRepository visaEntityRepository,
    IPaymentTransactionRepository transactionRepository,
    ICurrentUser currentUser,
    Domain.UnitOfWork.IUnitOfWork unitOfWork,
    Application.Services.IPostPaymentVisaGateService visaGateService)
    : IRequestHandler<RegisterVisaDetailsCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(RegisterVisaDetailsCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = currentUser.Id;
        if (currentUserId == null)
            return Error.Unauthorized("User.Unauthorized", "User is not authenticated.");

        var visaApp = await visaRepository.GetByIdWithGraphAsync(request.VisaApplicationId, cancellationToken);
        if (visaApp == null)
            return Error.NotFound("Visa.NotFound", "Đơn visa không tồn tại.");

        var tourInstance = visaApp.BookingParticipant?.Booking?.TourInstance;
        if (tourInstance == null)
            return Error.NotFound("TourInstance.NotFound", "TourInstance không tồn tại.");

        if (!currentUser.IsInRole(Application.Common.Constant.RoleConstants.Admin) && !currentUser.IsInRole(Application.Common.Constant.RoleConstants.Manager))
        {
            var isManager = tourInstance.Managers.Any(m => m.UserId == currentUserId);
            if (!isManager)
                return Error.Forbidden("Visa.Forbidden", "Bạn không có quyền thao tác trên tour này.");
        }

        if (!visaApp.IsSystemAssisted)
            return Error.Validation("Visa.NotSystemAssisted", "Chỉ áp dụng đăng ký thông tin visa cho đơn có yêu cầu hỗ trợ từ hệ thống.");

        if (visaApp.Status == VisaStatus.Approved || visaApp.Status == VisaStatus.Rejected)
            return Error.Conflict("Visa.AlreadyFinalized", "Đơn visa đã ở trạng thái cuối, không thể chỉnh sửa thông tin.");

        // Không validate passport/visa expiry tại bước register-details — chỉ là nhập thông tin.
        // Passport + expiry sẽ được kiểm tra cuối cùng ở UpdateVisaApplicationStatusCommand khi approve.

        var performedBy = currentUserId.Value.ToString();

        // ─── Unified payment/fee handling if not quoted yet ───
        if (!visaApp.ServiceFeeTransactionId.HasValue)
        {
            if (!request.ServiceFee.HasValue || request.ServiceFee.Value <= 0)
            {
                return Error.Validation("Visa.ServiceFeeNotQuoted", "Chưa báo giá phí dịch vụ visa, không thể đăng ký thông tin.");
            }

            var booking = visaApp.BookingParticipant?.Booking;
            if (booking == null)
                return Error.NotFound("Booking.NotFound", "Booking không tồn tại.");

            // 1. Tạo Transaction mới type VisaServiceFee
            var transaction = PaymentTransactionEntity.Create(
                bookingId: booking.Id,
                transactionCode: $"VFEE-{Guid.CreateVersion7().ToString()[..8].ToUpper()}",
                type: TransactionType.VisaServiceFee,
                amount: request.ServiceFee.Value,
                paymentMethod: PaymentMethod.Sepay,
                paymentNote: $"Visa Support Fee for Booking {booking.Id} (Manual/Direct Register)",
                createdBy: performedBy);

            await transactionRepository.AddAsync(transaction, cancellationToken);

            // 2. Add VisaServiceFeeTotal vào booking (nhưng không đổi status)
            booking.AddVisaServiceFee(request.ServiceFee.Value, performedBy);

            // 3. Set service fee reference cho application và đánh dấu đã thanh toán
            visaApp.QuoteServiceFee(request.ServiceFee.Value, transaction.Id, performedBy);
            visaApp.MarkServiceFeePaid(transaction.Id, performedBy);
        }

        // Fallback: nếu manager không gửi DestinationCountry, dùng giá trị của VisaApplication (đã có sẵn).
        var destinationCountry = !string.IsNullOrWhiteSpace(request.DestinationCountry)
            ? request.DestinationCountry
            : visaApp.DestinationCountry;

        // Nếu vẫn trống, tự động suy luận quốc gia đến từ danh sách địa điểm của Tour (PlanLocations)
        if (string.IsNullOrWhiteSpace(destinationCountry))
        {
            destinationCountry = tourInstance.Tour?.PlanLocations?
                .FirstOrDefault(pl => !string.IsNullOrEmpty(pl.Country))?.Country;
        }

        // Nếu vẫn trống, suy luận dựa trên từ khóa trong tên TourName
        if (string.IsNullOrWhiteSpace(destinationCountry) && !string.IsNullOrEmpty(tourInstance.TourName))
        {
            if (tourInstance.TourName.Contains("Korea", StringComparison.OrdinalIgnoreCase))
                destinationCountry = "South Korea";
            else if (tourInstance.TourName.Contains("Japan", StringComparison.OrdinalIgnoreCase))
                destinationCountry = "Japan";
            else if (tourInstance.TourName.Contains("Europe", StringComparison.OrdinalIgnoreCase) || tourInstance.TourName.Contains("Schengen", StringComparison.OrdinalIgnoreCase))
                destinationCountry = "Schengen";
        }



        if (visaApp.Visa != null)
        {
            visaApp.Visa.Update(
                performedBy: performedBy,
                visaNumber: request.VisaNumber,
                entryType: request.EntryType ?? visaApp.Visa.EntryType,
                issuedAt: request.IssuedAt.ToUniversalTime(),
                expiresAt: request.ExpiresAt.ToUniversalTime(),
                destinationCountry: destinationCountry,
                category: request.Category ?? visaApp.Visa.Category,
                format: request.Format ?? visaApp.Visa.Format,
                maxStayDays: request.MaxStayDays,
                issuingAuthority: request.IssuingAuthority,
                fileUrl: request.VisaFileUrl ?? visaApp.Visa.FileUrl,
                status: VisaStatus.Approved);
        }
        else
        {
            var newVisa = VisaEntity.Create(
                visaApplicationId: visaApp.Id,
                performedBy: performedBy,
                visaNumber: request.VisaNumber,
                entryType: request.EntryType,
                issuedAt: request.IssuedAt.ToUniversalTime(),
                expiresAt: request.ExpiresAt.ToUniversalTime(),
                destinationCountry: destinationCountry,
                category: request.Category,
                format: request.Format,
                maxStayDays: request.MaxStayDays,
                issuingAuthority: request.IssuingAuthority,
                fileUrl: request.VisaFileUrl,
                status: VisaStatus.Approved);
            await visaEntityRepository.AddAsync(newVisa, cancellationToken);
            visaApp.Visa = newVisa;
        }

        if (!string.IsNullOrWhiteSpace(request.VisaFileUrl))
            visaApp.VisaFileUrl = request.VisaFileUrl;

        visaApp.Update(
            destinationCountry: destinationCountry,
            performedBy: performedBy,
            status: VisaStatus.Approved,
            minReturnDate: visaApp.MinReturnDate,
            refusalReason: null,
            visaFileUrl: request.VisaFileUrl ?? visaApp.VisaFileUrl);

        await unitOfWork.SaveChangeAsync(cancellationToken);

        // Sau khi approve visa trực tiếp, kích hoạt kiểm tra hoàn tất Visa Gate
        // (tương tự UpdateVisaApplicationStatusCommandHandler để tránh tour kẹt ở PendingVisa)
        if (visaApp.BookingParticipant?.BookingId != null)
        {
            var bookingId = visaApp.BookingParticipant.BookingId;
            _ = Task.Run(() => visaGateService.TryCompleteVisaGateAsync(bookingId, default));
        }

        return visaApp.Visa!.Id;
    }
}
