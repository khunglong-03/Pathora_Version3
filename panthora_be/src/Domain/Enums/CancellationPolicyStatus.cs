using System.ComponentModel;

namespace Domain.Enums;

public enum CancellationPolicyStatus
{
    None = 0,
    [Description("Active")]
    Active = 1,
    [Description("Inactive")]
    Inactive = 2
}
