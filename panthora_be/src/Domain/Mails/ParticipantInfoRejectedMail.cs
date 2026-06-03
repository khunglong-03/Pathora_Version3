using Domain.Mails;

namespace Domain.Mails;

[Mail("[Pathora] Thông tin hành khách cần cập nhật - {booking_code}", "participant-info-rejected")]
public sealed record ParticipantInfoRejectedMail(
    string CustomerName,
    string BookingCode,
    string ParticipantFullName,
    string RejectionReason,
    string UpdateLink,
    string HotlinePhone);
