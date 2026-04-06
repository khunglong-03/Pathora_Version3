using System.ComponentModel;

namespace Domain.Enums;

public enum ReservationStatus
{
    [Description("Pending")]
    Pending = 1,

    [Description("Confirmed")]
    Confirmed = 2,

    [Description("Completed")]
    Completed = 3,

    [Description("Cancelled")]
    Cancelled = 4
}
