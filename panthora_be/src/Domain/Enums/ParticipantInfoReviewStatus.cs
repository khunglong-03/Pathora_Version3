using System.ComponentModel;

namespace Domain.Enums;

public enum ParticipantInfoReviewStatus
{
    [Description("NotReviewed")]
    NotReviewed = 0,

    [Description("Approved")]
    Approved = 1,

    [Description("Rejected")]
    Rejected = 2
}
