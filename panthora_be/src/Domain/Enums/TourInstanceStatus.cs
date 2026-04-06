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
    Cancelled = 6
}
