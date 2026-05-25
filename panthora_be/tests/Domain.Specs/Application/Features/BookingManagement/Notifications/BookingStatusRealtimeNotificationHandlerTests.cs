using Application.Features.BookingManagement.Notifications;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Events;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement.Notifications;

public sealed class BookingStatusRealtimeNotificationHandlerTests
{
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly IBookingStatusNotificationBroadcaster _broadcaster = Substitute.For<IBookingStatusNotificationBroadcaster>();
    private readonly ILogger<BookingStatusRealtimeNotificationHandler> _logger = Substitute.For<ILogger<BookingStatusRealtimeNotificationHandler>>();
    private readonly BookingStatusRealtimeNotificationHandler _handler;

    public BookingStatusRealtimeNotificationHandlerTests()
    {
        _handler = new BookingStatusRealtimeNotificationHandler(_bookingRepository, _broadcaster, _logger);
    }

    [Fact]
    public async Task Handle_ManagerCancelledBooking_BroadcastsToCustomerUser()
    {
        var bookingId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var managerId = Guid.NewGuid();
        var booking = CreateBooking(bookingId, userId, email: "customer@test.com");
        booking.PaymentTransactions.Add(CreateCompletedTransaction(bookingId, TransactionType.Deposit, 3_000_000m));
        booking.PaymentTransactions.Add(CreateCompletedTransaction(bookingId, TransactionType.Refund, 500_000m));
        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);

        await _handler.Handle(
            new BookingStatusChangedEvent(bookingId, BookingStatus.Paid, BookingStatus.Cancelled, managerId.ToString()),
            CancellationToken.None);

        await _broadcaster.Received(1).BroadcastAsync(
            userId,
            Arg.Is<BookingStatusNotificationPayload>(payload =>
                payload.BookingId == bookingId &&
                payload.NewStatus == BookingStatus.Cancelled &&
                payload.PaidAmount == 2_500_000m &&
                payload.RemainingBalance == 7_500_000m),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_SkipsCompletedStatus()
    {
        await _handler.Handle(
            new BookingStatusChangedEvent(Guid.NewGuid(), BookingStatus.Paid, BookingStatus.Completed, Guid.NewGuid().ToString()),
            CancellationToken.None);

        await _bookingRepository.DidNotReceive().GetByIdWithDetailsAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        await _broadcaster.DidNotReceive().BroadcastAsync(
            Arg.Any<Guid>(),
            Arg.Any<BookingStatusNotificationPayload>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_MissingCustomerEmail_StillBroadcastsToCustomerUser()
    {
        var bookingId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var booking = CreateBooking(bookingId, userId, email: null);
        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);

        await _handler.Handle(
            new BookingStatusChangedEvent(bookingId, BookingStatus.Confirmed, BookingStatus.Cancelled, Guid.NewGuid().ToString()),
            CancellationToken.None);

        await _broadcaster.Received(1).BroadcastAsync(
            userId,
            Arg.Is<BookingStatusNotificationPayload>(payload => payload.BookingId == bookingId),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CustomerInitiatedCancel_DoesNotBroadcastDuplicate()
    {
        var bookingId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var booking = CreateBooking(bookingId, userId, email: "customer@test.com");
        _bookingRepository.GetByIdWithDetailsAsync(bookingId, Arg.Any<CancellationToken>()).Returns(booking);

        await _handler.Handle(
            new BookingStatusChangedEvent(bookingId, BookingStatus.Confirmed, BookingStatus.Cancelled, userId.ToString()),
            CancellationToken.None);

        await _broadcaster.DidNotReceive().BroadcastAsync(
            Arg.Any<Guid>(),
            Arg.Any<BookingStatusNotificationPayload>(),
            Arg.Any<CancellationToken>());
    }

    private static BookingEntity CreateBooking(Guid bookingId, Guid userId, string? email)
    {
        var booking = BookingEntity.Create(
            Guid.NewGuid(),
            "Test Customer",
            "+84123456789",
            2,
            10_000_000m,
            PaymentMethod.VnPay,
            true,
            "TEST",
            userId,
            customerEmail: email);
        typeof(BookingEntity).GetProperty(nameof(BookingEntity.Id))!.SetValue(booking, bookingId);
        booking.Cancel("Tour bị huỷ bởi Manager", Guid.NewGuid().ToString());
        booking.InitializeRefundTracking(3_000_000m, "MANAGER");
        return booking;
    }

    private static PaymentTransactionEntity CreateCompletedTransaction(Guid bookingId, TransactionType type, decimal amount)
    {
        var transaction = PaymentTransactionEntity.Create(
            bookingId,
            Guid.NewGuid().ToString("N"),
            type,
            amount,
            PaymentMethod.VnPay,
            "Test payment",
            "TEST");
        transaction.MarkAsPaid(amount, DateTimeOffset.UtcNow);
        return transaction;
    }
}
