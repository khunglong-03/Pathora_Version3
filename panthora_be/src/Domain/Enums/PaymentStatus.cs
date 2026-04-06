using System.ComponentModel;

namespace Domain.Enums;

public enum PaymentStatus
{
    [Description("Unpaid")]
    Unpaid = 1,

    [Description("Partial")]
    Partial = 2,

    [Description("Paid")]
    Paid = 3,

    [Description("Settled")]
    Settled = 4,

    [Description("Overpaid")]
    Overpaid = 5
}
