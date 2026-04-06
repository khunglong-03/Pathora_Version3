using System.ComponentModel;

namespace Domain.Enums;

public enum VisaEntryType
{
    [Description("Single")]
    Single = 1,

    [Description("Double")]
    Double = 2,

    [Description("Multiple")]
    Multiple = 3
}
