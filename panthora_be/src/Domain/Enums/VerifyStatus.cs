using System.ComponentModel;

namespace Domain.Enums;

public enum VerifyStatus
{
    [Description("Unverified")]
    Unverified = 0,
    [Description("Verified")]
    Verified = 1
}
