using System.ComponentModel;

namespace Domain.Enums;

public enum TourStatus
{
    [Description("Active")]
    Active = 1,
    [Description("Inactive")]
    Inactive = 2,
    [Description("Pending")]
    Pending = 3,
    [Description("Rejected")]
    Rejected = 4
}
