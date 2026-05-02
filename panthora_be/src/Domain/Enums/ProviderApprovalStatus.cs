using System.ComponentModel;

namespace Domain.Enums;

public enum ProviderApprovalStatus
{
    [Description("Chưa gán")]
    NotAssigned = 0,

    [Description("Chờ duyệt")]
    Pending = 1,

    [Description("Đã duyệt")]
    Approved = 2,

    [Description("Từ chối")]
    Rejected = 3
}
