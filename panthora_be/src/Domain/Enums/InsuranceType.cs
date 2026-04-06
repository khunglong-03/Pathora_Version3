using System.ComponentModel;

namespace Domain.Enums;

public enum InsuranceType
{
    [Description("None")]
    None = 0,
    [Description("Travel Insurance")]
    Travel = 1,
    [Description("Health Insurance")]
    Health = 2,
    [Description("Trip Cancellation Insurance")]
    TripCancellation = 3,
    [Description("Baggage Loss Insurance")]
    BaggageLoss = 4,
    [Description("Personal Liability Insurance")]
    PersonalLiability = 5,
    [Description("Adventure Sports Insurance")]
    AdventureSports = 6
}
