using System.ComponentModel;

namespace Domain.Enums;

public enum RoleStatus
{
    [Description("Active")]
    Active = 1,
    [Description("Inactive")]
    Inactive = 2
}

