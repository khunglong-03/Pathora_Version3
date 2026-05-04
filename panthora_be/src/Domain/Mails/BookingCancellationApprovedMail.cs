namespace Domain.Mails;

[Mail("Yêu cầu hủy đặt chỗ được chấp thuận", "booking-cancellation-approved.html")]
public record BookingCancellationApprovedMail(
    string CustomerName,
    string BookingId,
    string TourName,
    string RefundAmount);
