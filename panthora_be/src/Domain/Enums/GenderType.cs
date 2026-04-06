using System.ComponentModel;

namespace Domain.Enums;

public enum GenderType
{
    [Description("Male")]
    Male = 0,
    [Description("Female")]
    Female = 1,
    [Description("Other")]
    Other = 2
}
