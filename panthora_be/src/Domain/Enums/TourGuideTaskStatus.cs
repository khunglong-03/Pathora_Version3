using System.ComponentModel;

namespace Domain.Enums;

public enum TourGuideTaskStatus
{
    [Description("Pending")]
    Pending = 0,

    [Description("Completed")]
    Completed = 1
}
