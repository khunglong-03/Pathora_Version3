using System.ComponentModel;

namespace Domain.Enums;

public enum BookingStatus
{
    [Description("Pending")]
    Pending = 1,
    [Description("Confirmed")]
    Confirmed = 2,
    [Description("Deposited")]
    Deposited = 3,
    [Description("Paid")]
    Paid = 4,
    [Description("Cancelled")]
    Cancelled = 5,
    [Description("Completed")]
    Completed = 6
}
