using System.ComponentModel;

namespace Domain.Enums;

public enum DepositStatus
{
    [Description("Pending")]
    Pending = 1,
    [Description("Paid")]
    Paid = 2,
    [Description("Overdue")]
    Overdue = 3,
    [Description("Waived")]
    Waived = 4
}
