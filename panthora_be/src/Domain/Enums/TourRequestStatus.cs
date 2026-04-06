using System.ComponentModel;

namespace Domain.Enums;

public enum TourRequestStatus
{
    [Description("Pending")]
    Pending = 1,
    [Description("Approved")]
    Approved = 2,
    [Description("Rejected")]
    Rejected = 3,
    [Description("Cancelled")]
    Cancelled = 4
}
