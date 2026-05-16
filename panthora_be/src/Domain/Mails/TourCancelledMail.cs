namespace Domain.Mails;

[Mail("Tour bị huỷ - Thông báo hoàn tiền", "tour-cancelled")]
public record TourCancelledMail(
    string CustomerName,
    string BookingId,
    string TourName,
    string RefundOutstandingAmount,
    string HotlinePhone);
