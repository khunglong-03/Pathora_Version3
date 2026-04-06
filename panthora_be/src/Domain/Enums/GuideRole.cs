using System.ComponentModel;

namespace Domain.Enums;

public enum GuideRole
{
    [Description("LeadGuide")]
    LeadGuide = 1,

    [Description("Assistant")]
    Assistant = 2,

    [Description("Support")]
    Support = 3
}
