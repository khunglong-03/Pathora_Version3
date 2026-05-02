using Application.Common.Constant;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using MediatR;
using System.Text.Json.Serialization;

namespace Application.Contracts.Payment;

/// <summary>
/// Tạo giao dịch SePay/VietQR thanh toán (full hoặc deposit) cho private tour (instance Draft, booking PrivateCustomTourRequest).
/// </summary>
public sealed record CreatePrivateTourInitialPaymentCommand(
    [property: JsonPropertyName("bookingId")] Guid BookingId) : IRequest<ErrorOr<PaymentTransactionEntity>>;

public sealed class CreatePrivateTourInitialPaymentCommandValidator : AbstractValidator<CreatePrivateTourInitialPaymentCommand>
{
    public CreatePrivateTourInitialPaymentCommandValidator()
    {
        RuleFor(x => x.BookingId)
            .NotEmpty().WithMessage(ValidationMessages.PaymentBookingIdRequired);
    }
}

public sealed class CreatePrivateTourInitialPaymentCommandHandler(
    IBookingRepository bookingRepository,
    IDepositPolicyRepository depositPolicyRepository,
    ITourInstanceRepository tourInstanceRepository,
    IPaymentService paymentService)
    : IRequestHandler<CreatePrivateTourInitialPaymentCommand, ErrorOr<PaymentTransactionEntity>>
{
    public async Task<ErrorOr<PaymentTransactionEntity>> Handle(
        CreatePrivateTourInitialPaymentCommand request,
        CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdAsync(request.BookingId, cancellationToken);
        if (booking is null)
        {
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
        }

        if (booking.BookingType != BookingType.PrivateCustomTourRequest)
        {
            return Error.Validation(
                "PrivateTour.NotCustomRequest",
                "Booking không phải yêu cầu tour riêng.");
        }

        if (booking.Status != BookingStatus.Pending)
        {
            return Error.Conflict(
                "PrivateTour.BookingNotPending",
                "Chỉ booking chờ thanh toán mới tạo được link thanh toán ban đầu.");
        }

        var instance = booking.TourInstance;
        if (instance is null)
        {
            instance = await tourInstanceRepository.FindById(booking.TourInstanceId);
        }

        if (instance is null || instance.InstanceType != TourType.Private || instance.Status != TourInstanceStatus.Draft)
        {
            return Error.Validation(
                "PrivateTour.InvalidInstanceState",
                "Chỉ tour riêng ở trạng thái Draft mới dùng thanh toán ban đầu này.");
        }

        var createdBy = booking.UserId?.ToString() ?? "PUBLIC_USER";

        TransactionType transactionType;
        decimal amount;
        string note;

        if (booking.IsFullPay)
        {
            transactionType = TransactionType.FullPayment;
            amount = booking.TotalPrice;
            note = $"Private tour full payment — booking {booking.Id}";
        }
        else
        {
            // Tính deposit % từ policy (giống RequestPublicPrivateTourCommand)
            var tourScope = instance.Tour?.TourScope ?? TourScope.Domestic;
            var depositPolicies = await depositPolicyRepository.GetAllActiveAsync(cancellationToken);
            var policy = depositPolicies.FirstOrDefault(p => p.TourScope == tourScope);

            var depositPercentage = 30m; // default 30%
            if (policy != null)
            {
                if (policy.DepositType == DepositType.Percentage)
                {
                    depositPercentage = policy.DepositValue;
                }
                else
                {
                    depositPercentage = booking.TotalPrice > 0
                        ? (policy.DepositValue / booking.TotalPrice) * 100m
                        : 0m;
                }
            }

            transactionType = TransactionType.Deposit;
            amount = booking.TotalPrice * depositPercentage / 100m;
            note = $"Private tour deposit {depositPercentage:F0}% — booking {booking.Id}";
        }

        return await paymentService.CreatePaymentTransactionAsync(
            bookingId: booking.Id,
            type: transactionType,
            amount: amount,
            paymentMethod: booking.PaymentMethod,
            paymentNote: note,
            createdBy: createdBy);
    }
}
