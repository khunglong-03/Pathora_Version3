using Application.Common.Constant;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using MediatR;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.ItineraryFeedback;

public sealed record ApplyPrivateTourSettlementCommand(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("bookingId")] Guid BookingId)
    : IRequest<ErrorOr<PrivateTourSettlementResultDto>>;

public sealed class ApplyPrivateTourSettlementCommandValidator : AbstractValidator<ApplyPrivateTourSettlementCommand>
{
    public ApplyPrivateTourSettlementCommandValidator()
    {
        RuleFor(x => x.TourInstanceId).NotEmpty();
        RuleFor(x => x.BookingId).NotEmpty();
    }
}

public sealed class ApplyPrivateTourSettlementCommandHandler(
    IBookingRepository bookingRepository,
    ITourInstanceRepository tourInstanceRepository,
    IPaymentService paymentService,
    IPaymentTransactionRepository paymentTransactionRepository,
    ITransactionHistoryRepository transactionHistoryRepository,
    IUserRepository userRepository,
    IOwnershipValidator ownershipValidator,
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : IRequestHandler<ApplyPrivateTourSettlementCommand, ErrorOr<PrivateTourSettlementResultDto>>
{
    public async Task<ErrorOr<PrivateTourSettlementResultDto>> Handle(
        ApplyPrivateTourSettlementCommand request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(ownershipValidator.GetCurrentUserId(), out var userId))
            return Error.Unauthorized();

        var booking = await bookingRepository.GetByIdWithDetailsAsync(request.BookingId, cancellationToken);
        if (booking == null)
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);

        if (booking.TourInstanceId != request.TourInstanceId)
            return Error.Validation("PrivateTour.BookingInstanceMismatch", "Booking không thuộc lịch trình này.");

        var instance = booking.TourInstance;
        if (instance.InstanceType != TourType.Private)
            return Error.Validation("PrivateTour.NotPrivate", "Chỉ booking tour riêng mới quyết toán Delta.");

        var isAdmin = await ownershipValidator.IsAdminAsync(cancellationToken);
        if (!isAdmin && !PrivateTourCoDesignAccess.IsInstanceManager(instance, userId))
            return Error.Forbidden(ErrorConstants.ItineraryFeedback.ForbiddenCode, ErrorConstants.ItineraryFeedback.ForbiddenDescription);

        if (booking.Status != BookingStatus.Paid)
            return Error.Validation("PrivateTour.SettlementRequiresPaidBooking", "Booking phải đã thanh toán (Paid) trước khi quyết toán.");

        if (instance.FinalSellPrice is null)
            return Error.Validation("PrivateTour.FinalSellPriceMissing", "Cần set FinalSellPrice trước khi quyết toán.");

        var txs = await paymentTransactionRepository.GetByBookingIdListAsync(booking.Id, cancellationToken);
        var totalPaid = txs
            .Where(t => t.Status == TransactionStatus.Completed)
            .Sum(t => t.PaidAmount ?? t.Amount);

        var final = instance.FinalSellPrice.Value;
        var delta = final - totalPaid;

        if (delta > 0)
        {
            booking.MarkPendingAdjustment("SYSTEM");
            instance.ChangeStatus(TourInstanceStatus.PendingAdjustment, userId.ToString());

            await bookingRepository.UpdateAsync(booking, cancellationToken);
            await tourInstanceRepository.Update(instance, cancellationToken);

            var payResult = await paymentService.CreatePaymentTransactionAsync(
                booking.Id,
                TransactionType.FullPayment,
                delta,
                booking.PaymentMethod,
                $"Private tour top-up — booking {booking.Id}",
                userId.ToString());

            if (payResult.IsError)
                return payResult.Errors;

            await unitOfWork.SaveChangeAsync(cancellationToken);

            return new PrivateTourSettlementResultDto(delta, payResult.Value.Id, null);
        }

        if (delta < 0)
        {
            var credit = -delta;
            if (booking.UserId is not { } customerId)
                return Error.Validation("PrivateTour.CustomerUserRequired", "Cần UserId trên booking để hoàn chênh vào ví.");

            var user = await userRepository.FindById(customerId, cancellationToken);
            if (user is null)
                return Error.NotFound("User.NotFound", "Không tìm thấy người dùng.");

            user.CreditBalance(credit);
            userRepository.Update(user);

            var history = TransactionHistoryEntity.CreateCredit(
                customerId,
                credit,
                $"Hoàn chênh FinalSellPrice so với đã thanh toán (booking {booking.Id})",
                userId.ToString(),
                booking.Id);

            await transactionHistoryRepository.AddAsync(history, cancellationToken);

            instance.ChangeStatus(TourInstanceStatus.Confirmed, userId.ToString());
            await tourInstanceRepository.Update(instance, cancellationToken);
            await unitOfWork.SaveChangeAsync(cancellationToken);

            return new PrivateTourSettlementResultDto(delta, null, credit);
        }

        instance.ChangeStatus(TourInstanceStatus.Confirmed, userId.ToString());
        await tourInstanceRepository.Update(instance, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return new PrivateTourSettlementResultDto(0, null, null);
    }
}
