using System.ComponentModel;

namespace Domain.Enums;

public enum TourDayActivityType
{
    [Description("Sightseeing")]
    Sightseeing = 0,
    [Description("Dining")]
    Dining = 1,
    [Description("Shopping")]
    Shopping = 2,
    [Description("Adventure")]
    Adventure = 3,
    [Description("Relaxation")]
    Relaxation = 4,
    [Description("Cultural")]
    Cultural = 5,
    [Description("Entertainment")]
    Entertainment = 6,
    [Description("Transportation")]
    Transportation = 7,
    [Description("Accommodation")]
    Accommodation = 8,
    [Description("Free Time")]
    FreeTime = 9,
    [Description("Other")]
    Other = 99
}
