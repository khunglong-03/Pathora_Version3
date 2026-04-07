using System.ComponentModel;

namespace Domain.Enums;

public enum AssignedEntityType
{
    [Description("Tour Designer")]
    TourDesigner = 1,
    [Description("Tour Guide")]
    TourGuide = 2,
    [Description("Tour")]
    Tour = 3
}
