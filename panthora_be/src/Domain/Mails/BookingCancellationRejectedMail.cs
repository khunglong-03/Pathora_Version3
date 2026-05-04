using Domain.Mails;

namespace Domain.Mails;

[Mail("Yêu cầu hủy đặt chỗ bị từ chối", "booking-cancellation-rejected.html")]
public sealed record BookingCancellationRejectedMail(
    string CustomerName,
    string BookingId,
    string TourName,
    string ManagerNote);
