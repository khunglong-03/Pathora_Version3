using System.ComponentModel;

namespace Domain.Enums;

public enum TourScope
{
    [Description("Domestic")]
    Domestic = 1,
    [Description("International")]
    International = 2
}
