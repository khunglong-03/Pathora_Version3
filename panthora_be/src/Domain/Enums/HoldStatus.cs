using System.ComponentModel;

namespace Domain.Enums;

public enum HoldStatus
{
    [Description("Soft hold (temporary)")]
    Soft = 0,

    [Description("Hard hold (confirmed)")]
    Hard = 1
}
