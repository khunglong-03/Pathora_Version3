using System.ComponentModel;

namespace Domain.Enums;

public enum ActivityStatus
{
    [Description("NotStarted")]
    NotStarted = 1,

    [Description("InProgress")]
    InProgress = 2,

    [Description("Completed")]
    Completed = 3,

    [Description("Cancelled")]
    Cancelled = 4
}
