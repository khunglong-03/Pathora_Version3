using System.ComponentModel;

namespace Domain.Enums;

public enum AssignmentStatus
{
    [Description("Assigned")]
    Assigned = 1,

    [Description("Confirmed")]
    Confirmed = 2,

    [Description("Active")]
    Active = 3,

    [Description("Completed")]
    Completed = 4,

    [Description("Cancelled")]
    Cancelled = 5
}
