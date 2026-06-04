using Domain.Entities;
using Domain.Enums;

namespace Domain.Mails;

[Mail("[Pathora] Còn ≤2 ngày — hoàn tất duyệt thông tin/visa hoặc booking sẽ bị huỷ", "participant-approval-warning")]
public record ParticipantApprovalWarningMail(
    string CustomerName,
    string BookingId,
    string TourName,
    string DepartureDate,
    string DeadlineDate,
    List<UnapprovedParticipantInfo> UnapprovedParticipants,
    string BookingUrl)
{
    public static ParticipantApprovalWarningMail Compose(BookingEntity booking, string baseUrl)
    {
        var localZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        var departureTimeLocal = TimeZoneInfo.ConvertTime(booking.TourInstance.StartDate, localZone);

        var deadline = booking.TourInstance.StartDate.AddDays(-1);
        var deadlineTimeLocal = TimeZoneInfo.ConvertTime(deadline, localZone);

        var unapprovedList = new List<UnapprovedParticipantInfo>();
        foreach (var p in booking.BookingParticipants)
        {
            bool infoUnapproved = p.InfoReviewStatus != ParticipantInfoReviewStatus.Approved;
            bool visaPendingOrRejected = p.VisaApplications.Any(v => v.Status == VisaStatus.Pending || v.Status == VisaStatus.Rejected);

            if (infoUnapproved || visaPendingOrRejected)
            {
                string reason = infoUnapproved
                    ? "Thông tin chưa duyệt"
                    : (p.VisaApplications.Any(v => v.Status == VisaStatus.Rejected) ? "Visa bị từ chối" : "Visa đang chờ");

                unapprovedList.Add(new UnapprovedParticipantInfo(p.FullName, reason));
            }
        }

        var updateLink = $"{baseUrl}/bookings/{booking.Id}/participants";

        return new ParticipantApprovalWarningMail(
            CustomerName: booking.CustomerName ?? "Quý khách",
            BookingId: booking.Id.ToString(),
            TourName: booking.TourInstance?.Tour?.TourName ?? "Tour",
            DepartureDate: departureTimeLocal.ToString("dd/MM/yyyy HH:mm"),
            DeadlineDate: deadlineTimeLocal.ToString("dd/MM/yyyy HH:mm"),
            UnapprovedParticipants: unapprovedList,
            BookingUrl: updateLink
        );
    }
}

public record UnapprovedParticipantInfo(string FullName, string Reason);
