using System.ComponentModel;

namespace Domain.Enums;

public enum UserStatus
{
    [Description("Active")]
    Active = 0,
    [Description("Inactive")]
    Inactive = 1,
    [Description("Banned")]
    Banned = 2,
}
