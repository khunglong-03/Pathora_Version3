using System.ComponentModel;

namespace Domain.Enums;

public enum TourPlanStatus
{
    [Description("Draft")]
    Draft = 0,
    [Description("Planning")]
    Planning = 1,
    [Description("Ready")]
    Ready = 2,
    [Description("Published")]
    Published = 3,
    [Description("In Progress")]
    InProgress = 4,
    [Description("Completed")]
    Completed = 5,
    [Description("Cancelled")]
    Cancelled = 6
}
