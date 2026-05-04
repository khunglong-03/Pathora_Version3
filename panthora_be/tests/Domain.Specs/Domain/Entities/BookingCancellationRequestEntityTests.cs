using Domain.Entities;
using Domain.Enums;

namespace Domain.Specs.Domain.Entities;

public sealed class BookingCancellationRequestEntityTests
{
    [Fact]
    public void Create_ShouldSnapshotPolicyFeeRefundDaysAndPreviousStatus()
    {
        var bookingId = Guid.NewGuid();
        var requestedByUserId = Guid.NewGuid();
        var policyId = Guid.NewGuid();

        var request = BookingCancellationRequestEntity.Create(
            bookingId,
            requestedByUserId,
            policyId,
            TourScope.Domestic,
            daysBeforeDeparture: 7,
            feePercent: 30,
            paidAmountSnapshot: 1_000_000m,
            refundAmount: 700_000m,
            customerReason: "Khách đổi lịch trình",
            previousBookingStatus: BookingStatus.Deposited,
            performedBy: "customer");

        Assert.NotEqual(Guid.Empty, request.Id);
        Assert.Equal(bookingId, request.BookingId);
        Assert.Equal(requestedByUserId, request.RequestedByUserId);
        Assert.Equal(policyId, request.CancellationPolicyId);
        Assert.Equal(TourScope.Domestic, request.TourScopeSnapshot);
        Assert.Equal(7, request.DaysBeforeDeparture);
        Assert.Equal(30, request.FeePercent);
        Assert.Equal(1_000_000m, request.PaidAmountSnapshot);
        Assert.Equal(700_000m, request.RefundAmount);
        Assert.Equal("Khách đổi lịch trình", request.CustomerReason);
        Assert.Equal(BookingStatus.Deposited, request.PreviousBookingStatus);
        Assert.Equal(BookingCancellationRequestStatus.PendingManagerReview, request.Status);
        Assert.Equal("customer", request.CreatedBy);
        Assert.Equal("customer", request.LastModifiedBy);
        Assert.NotEqual(default, request.CreatedAt);
        Assert.NotEqual(default, request.CreatedOnUtc);
    }

    [Fact]
    public void Approve_ShouldSetReviewedFieldsAndApprovedStatus()
    {
        var request = CreatePendingRequest();
        var managerId = Guid.NewGuid();

        request.Approve(managerId, "Đã duyệt hoàn tiền");

        Assert.Equal(BookingCancellationRequestStatus.Approved, request.Status);
        Assert.Equal(managerId, request.ReviewedByManagerId);
        Assert.Equal("Đã duyệt hoàn tiền", request.ManagerNote);
        Assert.NotNull(request.ReviewedAt);
    }

    [Fact]
    public void Reject_ShouldSetReviewedFieldsAndRejectedStatus()
    {
        var request = CreatePendingRequest();
        var managerId = Guid.NewGuid();

        request.Reject(managerId, "Không đủ điều kiện hủy");

        Assert.Equal(BookingCancellationRequestStatus.Rejected, request.Status);
        Assert.Equal(managerId, request.ReviewedByManagerId);
        Assert.Equal("Không đủ điều kiện hủy", request.ManagerNote);
        Assert.NotNull(request.ReviewedAt);
    }

    [Fact]
    public void ConfirmRefundPaid_WhenApproved_ShouldSetRefundFieldsAndRemainIdempotent()
    {
        var request = CreatePendingRequest();
        var managerId = Guid.NewGuid();
        request.Approve(managerId, null);

        request.ConfirmRefundPaid(managerId, "Mã GD 123");
        var firstConfirmedAt = request.RefundConfirmedAt;
        request.ConfirmRefundPaid(managerId, "Mã GD 456");

        Assert.NotNull(firstConfirmedAt);
        Assert.Equal(firstConfirmedAt, request.RefundConfirmedAt);
        Assert.Equal(managerId, request.RefundConfirmedByManagerId);
        Assert.Equal("Mã GD 123", request.RefundProofNote);
    }

    [Fact]
    public void ConfirmRefundPaid_WhenNotApproved_ShouldThrow()
    {
        var request = CreatePendingRequest();

        var act = () => request.ConfirmRefundPaid(Guid.NewGuid(), null);

        Assert.Throws<InvalidOperationException>(act);
    }

    private static BookingCancellationRequestEntity CreatePendingRequest()
    {
        return BookingCancellationRequestEntity.Create(
            Guid.NewGuid(),
            requestedByUserId: Guid.NewGuid(),
            cancellationPolicyId: Guid.NewGuid(),
            TourScope.Domestic,
            daysBeforeDeparture: 7,
            feePercent: 30,
            paidAmountSnapshot: 1_000_000m,
            refundAmount: 700_000m,
            customerReason: "Khách đổi lịch trình",
            previousBookingStatus: BookingStatus.Deposited,
            performedBy: "customer");
    }
}
