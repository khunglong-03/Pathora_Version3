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
/// Tạo giao dịch SePay/VietQR thanh toán 100% giá booking cho private tour (instance Draft, booking PrivateCustomTourRequest).
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
        if (instance.InstanceType != TourType.Private || instance.Status != TourInstanceStatus.Draft)
        {
            return Error.Validation(
                "PrivateTour.InvalidInstanceState",
                "Chỉ tour riêng ở trạng thái Draft mới dùng thanh toán ban đầu này.");
        }

        if (!booking.IsFullPay)
        {
            return Error.Validation(
                "PrivateTour.FullPayRequired",
                "Thanh toán ban đầu yêu cầu booking full pay.");
        }

        var createdBy = booking.UserId?.ToString() ?? "PUBLIC_USER";
        var note = $"Private tour base — booking {booking.Id}";

        return await paymentService.CreatePaymentTransactionAsync(
            bookingId: booking.Id,
            type: TransactionType.FullPayment,
            amount: booking.TotalPrice,
            paymentMethod: booking.PaymentMethod,
            paymentNote: note,
            createdBy: createdBy);
    }
}
