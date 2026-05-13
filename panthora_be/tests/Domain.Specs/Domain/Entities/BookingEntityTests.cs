using Domain.Entities;
using Domain.Enums;
using Domain.Events;
using Xunit;

namespace Domain.Specs.Domain.Entities;

public class BookingEntityTests
{
    private static BookingEntity CreateValidBooking()
    {
        return BookingEntity.Create(
            Guid.NewGuid(), "Customer", "123", 1, 1000m, PaymentMethod.VnPay, true, "TEST");
    }

    [Fact]
    public void AddVisaServiceFee_WithPositiveAmount_ShouldIncreaseTotals()
    {
        var booking = CreateValidBooking();
        var initialTotal = booking.TotalPrice;
        var fee = 100m;

        booking.AddVisaServiceFee(fee, "TEST");

        Assert.Equal(fee, booking.VisaServiceFeeTotal);
        Assert.Equal(initialTotal + fee, booking.TotalPrice);
    }

    [Fact]
    public void AddVisaServiceFee_WithZeroOrNegativeAmount_ShouldThrow()
    {
        var booking = CreateValidBooking();

        var act1 = () => booking.AddVisaServiceFee(0m, "TEST");
        var act2 = () => booking.AddVisaServiceFee(-100m, "TEST");

        Assert.Throws<ArgumentOutOfRangeException>(act1);
        Assert.Throws<ArgumentOutOfRangeException>(act2);
    }

    [Fact]
    public void BookingStatus_ShouldIncludePendingCancellation()
    {
        Assert.Equal(8, (int)BookingStatus.PendingCancellation);
    }

    [Theory]
    [InlineData(BookingStatus.Confirmed)]
    [InlineData(BookingStatus.Deposited)]
    [InlineData(BookingStatus.Paid)]
    public void RequestCancellation_FromEligibleStatus_ShouldSetPendingCancellationWithoutCancelling(BookingStatus status)
    {
        var booking = CreateValidBooking();
        booking.Status = status;

        booking.RequestCancellation("CUSTOMER");

        Assert.Equal(BookingStatus.PendingCancellation, booking.Status);
        Assert.Null(booking.CancelledAt);
        Assert.Null(booking.CancelReason);
        Assert.Contains(booking.DomainEvents, domainEvent =>
            domainEvent is BookingCancellationRequestedEvent requested &&
            requested.BookingId == booking.Id &&
            requested.PreviousStatus == status &&
            requested.PerformedBy == "CUSTOMER");
    }

    [Fact]
    public void ApproveCancellation_FromPendingCancellation_ShouldCancelBookingAndRaiseEvent()
    {
        var booking = CreateValidBooking();
        booking.Status = BookingStatus.Paid;
        booking.RequestCancellation("CUSTOMER");

        booking.ApproveCancellation("Khách hủy booking", "MANAGER");

        Assert.Equal(BookingStatus.Cancelled, booking.Status);
        Assert.NotNull(booking.CancelledAt);
        Assert.Equal("Khách hủy booking", booking.CancelReason);
        Assert.Contains(booking.DomainEvents, domainEvent =>
            domainEvent is BookingCancellationApprovedEvent approved &&
            approved.BookingId == booking.Id &&
            approved.PerformedBy == "MANAGER");
    }

    [Theory]
    [InlineData(BookingStatus.Confirmed)]
    [InlineData(BookingStatus.Deposited)]
    [InlineData(BookingStatus.Paid)]
    public void RejectCancellation_FromPendingCancellation_ShouldRestoreEligiblePreviousStatus(BookingStatus restoreTo)
    {
        var booking = CreateValidBooking();
        booking.Status = BookingStatus.Paid;
        booking.RequestCancellation("CUSTOMER");

        booking.RejectCancellation(restoreTo, "MANAGER");

        Assert.Equal(restoreTo, booking.Status);
        Assert.Null(booking.CancelledAt);
        Assert.Contains(booking.DomainEvents, domainEvent =>
            domainEvent is BookingCancellationRejectedEvent rejected &&
            rejected.BookingId == booking.Id &&
            rejected.RestoredStatus == restoreTo &&
            rejected.PerformedBy == "MANAGER");
    }

    [Theory]
    [InlineData(BookingStatus.Pending)]
    [InlineData(BookingStatus.Completed)]
    [InlineData(BookingStatus.Cancelled)]
    [InlineData(BookingStatus.PendingAdjustment)]
    public void RejectCancellation_WithInvalidRestoreStatus_ShouldThrow(BookingStatus restoreTo)
    {
        var booking = CreateValidBooking();
        booking.Status = BookingStatus.Paid;
        booking.RequestCancellation("CUSTOMER");

        var act = () => booking.RejectCancellation(restoreTo, "MANAGER");

        Assert.Throws<InvalidOperationException>(act);
    }

    [Theory]
    [InlineData(BookingStatus.Pending)]
    [InlineData(BookingStatus.PendingAdjustment)]
    [InlineData(BookingStatus.Completed)]
    [InlineData(BookingStatus.Cancelled)]
    public void RequestCancellation_FromIneligibleStatus_ShouldThrow(BookingStatus status)
    {
        var booking = CreateValidBooking();
        booking.Status = status;

        var act = () => booking.RequestCancellation("CUSTOMER");

        Assert.Throws<InvalidOperationException>(act);
    }
}
