using global::Application.Features.BookingCancellation.Commands;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using global::NSubstitute;
using global::Xunit;
using global::ErrorOr;
using global::System;
using global::System.Collections.Generic;
using global::System.Threading;
using global::System.Threading.Tasks;

namespace Domain.Specs.Application.Features.BookingCancellation.Commands;

public sealed class ConfirmRefundCommandHandlerTests
{
    private readonly IBookingCancellationRequestRepository _cancellationRequestRepository = Substitute.For<IBookingCancellationRequestRepository>();
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly IPaymentTransactionRepository _paymentTransactionRepository = Substitute.For<IPaymentTransactionRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    private ConfirmRefundCommandHandler CreateHandler() => new(
        _cancellationRequestRepository,
        _bookingRepository,
        _paymentTransactionRepository,
        _unitOfWork);

    [Fact]
    public async Task Handle_WhenRequestIsApproved_ConfirmRefundPaidAndCreatesRefundTransaction()
    {
        // Arrange
        var requestId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var managerId = Guid.NewGuid();

        var cancellationRequest = new BookingCancellationRequestEntity
        {
            Id = requestId,
            BookingId = bookingId,
            RefundAmount = 500000m,
            Status = BookingCancellationRequestStatus.Approved
        };

        var booking = BookingEntity.Create(
            tourInstanceId: Guid.NewGuid(),
            customerName: "Nguyen A",
            customerPhone: "+84912345678",
            numberAdult: 2,
            totalPrice: 2000000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: true,
            performedBy: Guid.NewGuid().ToString());

        booking.Id = bookingId;
        booking.Status = BookingStatus.Cancelled;
        booking.InitializeRefundTracking(2000000m, managerId.ToString());

        _cancellationRequestRepository.GetById(requestId, Arg.Any<CancellationToken>())
            .Returns(cancellationRequest);

        _bookingRepository.GetByIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(booking);

        _unitOfWork.ExecuteTransactionAsync(Arg.Any<System.Data.IsolationLevel>(), Arg.Any<Func<Task>>())
            .Returns(call => call.Arg<Func<Task>>()());

        var cmd = new ConfirmRefundCommand(requestId, "Hoàn trả đầy đủ", managerId);

        // Act
        var result = await CreateHandler().Handle(cmd, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.NotNull(cancellationRequest.RefundConfirmedAt);
        Assert.Equal(RefundStatus.Refunded, booking.RefundStatus);

        await _paymentTransactionRepository.Received(1).AddAsync(
            Arg.Is<PaymentTransactionEntity>(t =>
                t.BookingId == bookingId &&
                t.Type == TransactionType.Refund &&
                t.Amount == 500000m &&
                t.Status == TransactionStatus.Completed),
            Arg.Any<CancellationToken>());

        await _bookingRepository.Received(1).UpdateWithoutSaveAsync(booking);
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }
}
