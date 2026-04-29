using Domain.Entities;
using Domain.Enums;

namespace Domain.Specs.Domain.PrivateTour;

/// <summary>OpenSpec private-custom-tour — regression for new <see cref="TourInstanceStatus"/> / <see cref="BookingStatus"/> paths (task §7.1).</summary>
public sealed class PrivateTourStateMachineTests
{
    private static TourInstanceEntity PrivateDraft()
    {
        return TourInstanceEntity.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "t",
            "tn",
            "TC",
            "cl",
            TourType.Private,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow.AddDays(2),
            10,
            10_000m,
            "sys");
    }

    [Fact]
    public void TourInstance_Draft_CanCancel()
    {
        var ti = PrivateDraft();
        ti.ChangeStatus(TourInstanceStatus.Cancelled, "op");
        Assert.Equal(TourInstanceStatus.Cancelled, ti.Status);
    }

    [Fact]
    public void TourInstance_Draft_CannotJumpToAvailable()
    {
        var ti = PrivateDraft();
        Assert.Throws<InvalidOperationException>(() =>
            ti.ChangeStatus(TourInstanceStatus.Available, "op"));
    }

    [Fact]
    public void TourInstance_Draft_CannotJumpToInProgress()
    {
        var ti = PrivateDraft();
        Assert.Throws<InvalidOperationException>(() =>
            ti.ChangeStatus(TourInstanceStatus.InProgress, "op"));
    }

    [Fact]
    public void TourInstance_PendingAdjustment_CannotRevertToDraft()
    {
        var ti = PrivateDraft();
        ti.ChangeStatus(TourInstanceStatus.PendingAdjustment, "op");
        Assert.Throws<InvalidOperationException>(() =>
            ti.ChangeStatus(TourInstanceStatus.Draft, "op"));
    }

    [Fact]
    public void TourInstance_PendingAdjustment_CannotGoToAvailable()
    {
        var ti = PrivateDraft();
        ti.ChangeStatus(TourInstanceStatus.PendingAdjustment, "op");
        Assert.Throws<InvalidOperationException>(() =>
            ti.ChangeStatus(TourInstanceStatus.Available, "op"));
    }

    [Fact]
    public void TourInstance_Cancelled_IsTerminalForChangeStatus()
    {
        var ti = PrivateDraft();
        ti.ChangeStatus(TourInstanceStatus.Cancelled, "op");
        Assert.Throws<InvalidOperationException>(() =>
            ti.ChangeStatus(TourInstanceStatus.Confirmed, "op"));
    }

    [Fact]
    public void Booking_PendingAdjustment_CannotDeposited()
    {
        var b = PaidBooking();
        b.MarkPendingAdjustment("sys");
        Assert.Throws<InvalidOperationException>(() => b.MarkDeposited("sys"));
    }

    [Fact]
    public void Booking_PendingAdjustment_CannotComplete()
    {
        var b = PaidBooking();
        b.MarkPendingAdjustment("sys");
        Assert.Throws<InvalidOperationException>(() => b.Complete("sys"));
    }

    [Fact]
    public void Booking_PendingAdjustment_CanCancel()
    {
        var b = PaidBooking();
        b.MarkPendingAdjustment("sys");
        b.Cancel("missed deadline", "sys");
        Assert.Equal(BookingStatus.Cancelled, b.Status);
    }

    private static BookingEntity PaidBooking()
    {
        var b = BookingEntity.Create(
            Guid.NewGuid(),
            "c",
            "1",
            2,
            100m,
            PaymentMethod.BankTransfer,
            true,
            "u");
        b.Confirm("u");
        b.MarkDeposited("u");
        b.MarkPaid("u");
        return b;
    }
}
