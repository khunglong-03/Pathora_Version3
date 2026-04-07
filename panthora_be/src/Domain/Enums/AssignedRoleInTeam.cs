using System.ComponentModel;

namespace Domain.Enums;

public enum AssignedRoleInTeam
{
    [Description("Leader")]
    Lead = 1,
    [Description("Member")]
    Member = 2
}
