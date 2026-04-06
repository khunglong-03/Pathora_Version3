using System.ComponentModel;

namespace Domain.Enums;

public enum PricingType
{
    [Description("Per Person")]
    PerPerson = 0,
    [Description("Per Room")]
    PerRoom = 1,
    [Description("Per Group")]
    PerGroup = 2,
    [Description("Per Ride")]
    PerRide = 3,
    [Description("Fixed Price")]
    Fixed = 4
}
