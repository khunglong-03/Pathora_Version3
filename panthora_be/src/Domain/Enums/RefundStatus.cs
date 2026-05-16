using System.ComponentModel;

namespace Domain.Enums;

public enum RefundStatus
{
    [Description("Chờ xử lý - Pending")]
    Pending = 1,

    [Description("Đã liên hệ - Contacted")]
    Contacted = 2,

    [Description("Đã hoàn tiền - Refunded")]
    Refunded = 3,

    [Description("Không áp dụng - NotApplicable")]
    NotApplicable = 4
}
