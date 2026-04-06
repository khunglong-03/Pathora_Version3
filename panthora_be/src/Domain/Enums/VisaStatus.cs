using System.ComponentModel;

namespace Domain.Enums;

public enum VisaStatus
{
    [Description("Pending")]
    Pending = 1,

    [Description("Processing")]
    Processing = 2,

    [Description("Approved")]
    Approved = 3,

    [Description("Rejected")]
    Rejected = 4,

    [Description("Cancelled")]
    Cancelled = 5
}
