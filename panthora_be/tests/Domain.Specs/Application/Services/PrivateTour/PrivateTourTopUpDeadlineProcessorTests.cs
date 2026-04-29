using global::Application.Common.Constant;
using global::Application.Services.PrivateTour;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace Domain.Specs.Application.Services.PrivateTour;

public sealed class PrivateTourTopUpDeadlineProcessorTests
{
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly IPrivateTourPolicyMetrics _metrics = Substitute.For<IPrivateTourPolicyMetrics>();

    [Fact]
    public async Task ProcessExpiredConfirmationDeadlinesAsync_WhenNoInstances_ReturnsZero_AndDoesNotRecordMetrics()
    {
        var now = DateTimeOffset.UtcNow;
        _tourInstanceRepository.ListPrivateInstancesPendingTopUpPastDeadlineAsync(now, Arg.Any<CancellationToken>())
            .Returns([]);

        var sut = new PrivateTourTopUpDeadlineProcessor(
            _tourInstanceRepository,
            _metrics,
            NullLogger<PrivateTourTopUpDeadlineProcessor>.Instance);

        var n = await sut.ProcessExpiredConfirmationDeadlinesAsync(now, CancellationToken.None);

        Assert.Equal(0, n);
        _metrics.DidNotReceive().RecordTopUpDeadlineForfeited(Arg.Any<int>(), Arg.Any<int>());
        await _tourInstanceRepository.DidNotReceive().Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ProcessExpiredConfirmationDeadlinesAsync_WhenNoPendingAdjustmentBookings_SkipsUpdate()
    {
        var now = DateTimeOffset.UtcNow;
        var instance = PastDeadlinePrivateInstance(now);
        instance.Bookings =
        [
            PastDeadlineBooking(instance.Id, BookingStatus.Paid)
        ];

        _tourInstanceRepository.ListPrivateInstancesPendingTopUpPastDeadlineAsync(now, Arg.Any<CancellationToken>())
            .Returns([instance]);

        var sut = new PrivateTourTopUpDeadlineProcessor(
            _tourInstanceRepository,
            _metrics,
            NullLogger<PrivateTourTopUpDeadlineProcessor>.Instance);

        var n = await sut.ProcessExpiredConfirmationDeadlinesAsync(now, CancellationToken.None);

        Assert.Equal(0, n);
        _metrics.DidNotReceive().RecordTopUpDeadlineForfeited(Arg.Any<int>(), Arg.Any<int>());
        await _tourInstanceRepository.DidNotReceive().Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ProcessExpiredConfirmationDeadlinesAsync_CancelsPendingTopUp_ClosesStaleTransactions_UpdatesInstance()
    {
        var now = DateTimeOffset.UtcNow;
        var instance = PastDeadlinePrivateInstance(now);
        instance.CurrentParticipation = 2;

        var booking = PastDeadlineBooking(instance.Id, BookingStatus.PendingAdjustment);
        var topUpTx = PaymentTransactionEntity.Create(
            booking.Id,
            "TOPUP-PENDING",
            TransactionType.FullPayment,
            5000m,
            PaymentMethod.BankTransfer,
            "sys",
            "sys");
        booking.PaymentTransactions = [topUpTx];
        instance.Bookings = [booking];
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        _tourInstanceRepository.ListPrivateInstancesPendingTopUpPastDeadlineAsync(now, Arg.Any<CancellationToken>())
            .Returns([instance]);

        var sut = new PrivateTourTopUpDeadlineProcessor(
            _tourInstanceRepository,
            _metrics,
            NullLogger<PrivateTourTopUpDeadlineProcessor>.Instance);

        var n = await sut.ProcessExpiredConfirmationDeadlinesAsync(now, CancellationToken.None);

        Assert.Equal(1, n);
        Assert.Equal(TourInstanceStatus.Cancelled, instance.Status);
        Assert.Equal(BookingStatus.Cancelled, booking.Status);
        Assert.Equal(PrivateTourPolicyMessages.TopUpNotPaidByConfirmationDeadline, booking.CancelReason);
        Assert.Equal(0, instance.CurrentParticipation);
        Assert.Equal(TransactionStatus.Failed, topUpTx.Status);
        Assert.Equal(PrivateTourPolicyMessages.TopUpDeadlineErrorCode, topUpTx.ErrorCode);

        _metrics.Received(1).RecordTopUpDeadlineForfeited(1, 1);
        await _tourInstanceRepository.Received(1).Update(instance, CancellationToken.None);
    }

    [Fact]
    public async Task ProcessExpiredConfirmationDeadlinesAsync_RecordsAggregatedBookingCountAcrossInstances()
    {
        var now = DateTimeOffset.UtcNow;
        var a = PastDeadlinePrivateInstance(now);
        a.CurrentParticipation = 1;
        var ba = PastDeadlineBooking(a.Id, BookingStatus.PendingAdjustment);
        a.Bookings = [ba];

        var b = PastDeadlinePrivateInstance(now);
        b.CurrentParticipation = 4;
        var b1 = PastDeadlineBooking(b.Id, BookingStatus.PendingAdjustment);
        var b2 = PastDeadlineBooking(b.Id, BookingStatus.PendingAdjustment);
        b.Bookings = [b1, b2];

        _tourInstanceRepository.ListPrivateInstancesPendingTopUpPastDeadlineAsync(now, Arg.Any<CancellationToken>())
            .Returns([a, b]);
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var sut = new PrivateTourTopUpDeadlineProcessor(
            _tourInstanceRepository,
            _metrics,
            NullLogger<PrivateTourTopUpDeadlineProcessor>.Instance);

        var n = await sut.ProcessExpiredConfirmationDeadlinesAsync(now, CancellationToken.None);

        Assert.Equal(2, n);
        _metrics.Received(1).RecordTopUpDeadlineForfeited(2, 3);
        await _tourInstanceRepository.Received(2).Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>());
    }

    private static TourInstanceEntity PastDeadlinePrivateInstance(DateTimeOffset nowUtc)
    {
        var instance = TourInstanceEntity.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "t",
            "tn",
            "TC",
            "cl",
            TourType.Private,
            nowUtc.AddDays(10),
            nowUtc.AddDays(12),
            10,
            10000m,
            "sys",
            confirmationDeadline: nowUtc.AddDays(-1));
        instance.Status = TourInstanceStatus.PendingAdjustment;
        instance.ConfirmationDeadline = nowUtc.AddHours(-1);
        return instance;
    }

    private static BookingEntity PastDeadlineBooking(Guid instanceId, BookingStatus status)
    {
        var booking = BookingEntity.Create(
            instanceId,
            "A",
            "0909",
            2,
            10000m,
            PaymentMethod.BankTransfer,
            true,
            "sys");
        booking.Status = status;
        booking.TourInstanceId = instanceId;
        return booking;
    }
}
