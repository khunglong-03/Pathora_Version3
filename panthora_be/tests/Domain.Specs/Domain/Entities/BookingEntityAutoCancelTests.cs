using Application.Common.Constant;
using Domain.Entities;
using Domain.Enums;
using Domain.Events;
using Xunit;

namespace Domain.Specs.Domain.Entities;

public class BookingEntityAutoCancelTests
{
    private static BookingEntity CreateValidBooking()
    {
        return BookingEntity.Create(
            Guid.NewGuid(), "Customer", "123", 1, 1000m, PaymentMethod.VnPay, true, "TEST");
    }

    [Theory]
    [InlineData(BookingStatus.Pending)]
    [InlineData(BookingStatus.Confirmed)]
    [InlineData(BookingStatus.Deposited)]
    [InlineData(BookingStatus.Paid)]
    [InlineData(BookingStatus.PendingCancellation)]
    [InlineData(BookingStatus.PendingAdjustment)]
    public void AutoCancelDueToApprovalDeadline_FromEligibleStatus_ShouldCancelBookingAndEmitEvents(BookingStatus status)
    {
        // Arrange
        var booking = CreateValidBooking();
        booking.Status = status;

        // Act
        booking.AutoCancelDueToApprovalDeadline(
            ErrorConstants.BookingApprovalDeadline.AutoCancelReasonCode,
            "system");

        // Assert
        Assert.Equal(BookingStatus.Cancelled, booking.Status);
        Assert.Equal(ErrorConstants.BookingApprovalDeadline.AutoCancelReasonCode, booking.CancelReason);
        Assert.NotNull(booking.CancelledAt);
        Assert.NotNull(booking.ApprovalAutoCancelledAt);

        Assert.Contains(booking.DomainEvents, domainEvent =>
            domainEvent is BookingStatusChangedEvent changed &&
            changed.BookingId == booking.Id &&
            changed.OldStatus == status &&
            changed.NewStatus == BookingStatus.Cancelled &&
            changed.PerformedBy == "system");

        Assert.Contains(booking.DomainEvents, domainEvent =>
            domainEvent is BookingAutoCancelledForNonApprovalEvent autoCancel &&
            autoCancel.BookingId == booking.Id &&
            autoCancel.PreviousStatus == status &&
            autoCancel.ReasonCode == ErrorConstants.BookingApprovalDeadline.AutoCancelReasonCode &&
            autoCancel.PerformedBy == "system");
    }

    [Fact]
    public void AutoCancelDueToApprovalDeadline_WhenAlreadyAutoCancelled_ShouldBeNoOp()
    {
        // Arrange
        var booking = CreateValidBooking();
        booking.Status = BookingStatus.Paid;
        booking.AutoCancelDueToApprovalDeadline(
            ErrorConstants.BookingApprovalDeadline.AutoCancelReasonCode,
            "system");

        var initialApprovalAutoCancelledAt = booking.ApprovalAutoCancelledAt;

        // Act
        booking.AutoCancelDueToApprovalDeadline(
            "OtherReason",
            "other_user");

        // Assert
        Assert.Equal(BookingStatus.Cancelled, booking.Status);
        Assert.Equal(initialApprovalAutoCancelledAt, booking.ApprovalAutoCancelledAt);
        Assert.Equal(ErrorConstants.BookingApprovalDeadline.AutoCancelReasonCode, booking.CancelReason);
    }

    [Fact]
    public void AutoCancelDueToApprovalDeadline_FromCompletedStatus_ShouldThrow()
    {
        // Arrange
        var booking = CreateValidBooking();
        booking.Status = BookingStatus.Completed;

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() =>
            booking.AutoCancelDueToApprovalDeadline(
                ErrorConstants.BookingApprovalDeadline.AutoCancelReasonCode,
                "system"));
    }

    [Fact]
    public void AutoCancelDueToApprovalDeadline_IsIdempotent()
    {
        // Arrange
        var booking = CreateValidBooking();
        booking.Status = BookingStatus.Paid;

        // Act
        booking.AutoCancelDueToApprovalDeadline(
            ErrorConstants.BookingApprovalDeadline.AutoCancelReasonCode,
            "system");

        var initialEventsCount = booking.DomainEvents.Count;
        var initialCancelledAt = booking.ApprovalAutoCancelledAt;

        // Act again
        booking.AutoCancelDueToApprovalDeadline(
            ErrorConstants.BookingApprovalDeadline.AutoCancelReasonCode,
            "system");

        // Assert
        Assert.Equal(initialEventsCount, booking.DomainEvents.Count);
        Assert.Equal(initialCancelledAt, booking.ApprovalAutoCancelledAt);
    }
}
