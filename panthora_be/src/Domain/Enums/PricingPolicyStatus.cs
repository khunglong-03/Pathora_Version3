using System.ComponentModel;

namespace Domain.Enums;

public enum PricingPolicyStatus
{
    [Description("Active")]
    Active = 1,
    [Description("Inactive")]
    Inactive = 2
}
