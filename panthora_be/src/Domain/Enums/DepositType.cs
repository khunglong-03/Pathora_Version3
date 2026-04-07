using System.ComponentModel;

namespace Domain.Enums;

public enum DepositType
{
    [Description("Fixed Amount")]
    FixedAmount = 1,
    [Description("Percentage")]
    Percentage = 2
}
