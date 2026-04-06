using System.ComponentModel;

namespace Domain.Enums;

public enum TransactionStatus
{
    [Description("Pending - Chờ thanh toán")]
    Pending = 1,

    [Description("Processing - Đang xử lý")]
    Processing = 2,

    [Description("Completed - Đã hoàn tất")]
    Completed = 3,

    [Description("Failed - Thất bại")]
    Failed = 4,

    [Description("Refunded - Đã hoàn tiền")]
    Refunded = 5,

    [Description("Cancelled - Đã hủy")]
    Cancelled = 6
}

public enum TransactionType
{
    [Description("Deposit - Đặt cọc")]
    Deposit = 1,

    [Description("Full Payment - Thanh toán đầy đủ")]
    FullPayment = 2,

    [Description("Refund - Hoàn tiền")]
    Refund = 3
}
