using global::Domain.Enums;

namespace Domain.Specs.Domain.Enums;

public sealed class BookingCancellationRequestStatusTests
{
    [Fact]
    public void BookingCancellationRequestStatus_ShouldExposeWorkflowValues()
    {
        Assert.Equal(1, (int)BookingCancellationRequestStatus.PendingManagerReview);
        Assert.Equal(2, (int)BookingCancellationRequestStatus.Approved);
        Assert.Equal(3, (int)BookingCancellationRequestStatus.Rejected);
    }
}
