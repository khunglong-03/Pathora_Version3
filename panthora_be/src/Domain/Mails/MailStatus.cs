using System.ComponentModel;

namespace Domain.Mails;

public enum MailStatus
{
    [Description("Pending")]
    Pending,
    [Description("Sent")]
    Sent,
    [Description("Failed")]
    Failed
}

