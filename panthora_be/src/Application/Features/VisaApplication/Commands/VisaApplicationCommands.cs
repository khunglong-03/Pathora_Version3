using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
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
    [property: JsonPropertyName("visaFileUrl")] string? VisaFileUrl = null) : ICommand<ErrorOr<Guid>>;

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
            request.MinReturnDate,
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
    [property: JsonPropertyName("visaFileUrl")] string? VisaFileUrl = null) : ICommand<ErrorOr<Success>>;

public sealed class UpdateVisaApplicationStatusCommandValidator : AbstractValidator<UpdateVisaApplicationStatusCommand>
{
    public UpdateVisaApplicationStatusCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
    }
}

public sealed class UpdateVisaApplicationStatusCommandHandler(
    IVisaApplicationRepository repository,
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

        if (!currentUser.IsInRole(Application.Common.Constant.RoleConstants.Admin))
        {
            if (currentUser.IsInRole(Application.Common.Constant.RoleConstants.TourOperator) && !currentUser.IsInRole(Application.Common.Constant.RoleConstants.Manager))
                return Error.Forbidden("Visa.Forbidden", "Tour Operator không được duyệt/từ chối visa.");

            var isManager = tourInstance.Managers.Any(m => m.UserId == currentUserId);
            if (!isManager)
                return Error.Forbidden("Visa.Forbidden", "Chỉ manager của tour mới được phép thao tác.");
        }

        if (request.Status == VisaStatus.Rejected && tourInstance.Status != TourInstanceStatus.PendingVisa)
        {
            return Error.Conflict("Visa.CannotReject", "Không thể từ chối visa sau khi tour đã hoàn tất xác nhận visa (gate complete).");
        }

        if (request.Status == VisaStatus.Approved)
        {
            var passport = entity.Passport;
            if (passport == null || !passport.ExpiresAt.HasValue || passport.ExpiresAt.Value < tourInstance.EndDate)
                return Error.Validation("Visa.InvalidPassport", "Hộ chiếu chưa có hoặc đã hết hạn trước khi tour kết thúc.");
            
            // Note: Emit Event có thể add trực tiếp vào Domain Entity (Domain Event) 
            // hoặc gửi qua MediatR. Hiện tại Entity có CreateDomainEvent() không? 
            // Giả sử Update() trên entity sẽ xử lý logic domain event.
        }
        else if (request.Status == VisaStatus.Rejected)
        {
            if (string.IsNullOrWhiteSpace(request.RefusalReason))
                return Error.Validation("Visa.RefusalReasonRequired", "Bắt buộc phải nhập lý do từ chối.");
        }

        entity.Update(
            entity.DestinationCountry,
            currentUserId.Value.ToString(),
            request.Status,
            entity.MinReturnDate,
            request.RefusalReason?.Trim(),
            request.VisaFileUrl ?? entity.VisaFileUrl
        );

        repository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        // 4.7: Sau khi save thành công, kiểm tra hoàn tất Visa Gate
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
    : IRequest<ErrorOr<Guid>>;

public sealed class QuoteVisaSupportFeeCommandHandler(
    IVisaApplicationRepository visaRepository,
    IBookingRepository bookingRepository,
    IPaymentTransactionRepository transactionRepository,
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

        if (!currentUser.IsInRole(Application.Common.Constant.RoleConstants.Admin))
        {
            var isManager = tourInstance.Managers.Any(m => m.UserId == currentUserId);
            if (!isManager)
                return Error.Forbidden("Visa.Forbidden", "Chỉ manager của tour mới được phép báo giá phí visa.");
        }

        if (!visaApp.IsSystemAssisted)
            return Error.Validation("Visa.NotSystemAssisted", "Chỉ áp dụng báo giá phí cho đơn có yêu cầu hỗ trợ từ hệ thống.");

        if (visaApp.ServiceFeeTransactionId.HasValue)
        {
            // Nếu đã quote rồi thì trả lại transaction cũ
            return visaApp.ServiceFeeTransactionId.Value;
        }

        var booking = await bookingRepository.GetByIdAsync(visaApp.BookingParticipant!.BookingId);
        if (booking == null)
            return Error.NotFound("Booking.NotFound", "Booking không tồn tại.");

        var performedBy = currentUserId.Value.ToString();

        // 1. Tạo Transaction mới type VisaServiceFee
        var transaction = PaymentTransactionEntity.Create(
            bookingId: booking.Id,
            transactionCode: $"VFEE-{Guid.CreateVersion7().ToString()[..8].ToUpper()}",
            type: TransactionType.VisaServiceFee,
            amount: request.Fee,
            paymentMethod: PaymentMethod.Sepay,
            paymentNote: $"Visa Support Fee for Booking {booking.Id}",
            createdBy: performedBy);

        await transactionRepository.AddAsync(transaction, cancellationToken);

        // 2. Add VisaServiceFeeTotal vào booking (nhưng không đổi status)
        booking.AddVisaServiceFee(request.Fee, performedBy);
        await bookingRepository.UpdateWithoutSaveAsync(booking);

        // 3. Set service fee reference cho application
        visaApp.QuoteServiceFee(request.Fee, transaction.Id, performedBy);
        visaRepository.Update(visaApp);

        await unitOfWork.SaveChangeAsync(cancellationToken);

        return transaction.Id;
    }
}
