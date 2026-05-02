using System.ComponentModel;

namespace Domain.Enums;

public enum TourInstanceStatus
{
    [Description("Available")]
    Available = 1,
    [Description("Confirmed")]
    Confirmed = 2,
    [Description("SoldOut")]
    SoldOut = 3,
    [Description("InProgress")]
    InProgress = 4,
    [Description("Completed")]
    Completed = 5,
    [Description("Cancelled")]
    Cancelled = 6,
    [Description("Pending Approval")]
    PendingApproval = 7,
    [Description("Draft")]
    Draft = 8,
    [Description("Pending Adjustment")]
    PendingAdjustment = 9,
    [Description("Pending Manager Review")]
    PendingManagerReview = 10,
    [Description("Pending Customer Approval")]
    PendingCustomerApproval = 11
}
