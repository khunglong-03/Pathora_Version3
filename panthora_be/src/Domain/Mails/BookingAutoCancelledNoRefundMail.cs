using Domain.Entities;
using Domain.Enums;

namespace Domain.Mails;

[Mail("[Pathora] Booking đã bị huỷ — không hoàn tiền", "booking-auto-cancelled-no-refund")]
public record BookingAutoCancelledNoRefundMail(
    string CustomerName,
    string BookingId,
    string TourName,
    string DepartureDate,
    string CancelReason,
    string ForfeitAmount,
    string SupportHotline)
{
    public static BookingAutoCancelledNoRefundMail Compose(BookingEntity booking, string hotline, string cancelReasonText)
    {
        var localZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        var departureTimeLocal = TimeZoneInfo.ConvertTime(booking.TourInstance.StartDate, localZone);

        return new BookingAutoCancelledNoRefundMail(
            CustomerName: booking.CustomerName ?? "Quý khách",
            BookingId: booking.Id.ToString(),
            TourName: booking.TourInstance?.Tour?.TourName ?? "Tour",
            DepartureDate: departureTimeLocal.ToString("dd/MM/yyyy HH:mm"),
            CancelReason: cancelReasonText,
            ForfeitAmount: booking.TotalPrice.ToString("N0") + "đ",
            SupportHotline: hotline
        );
    }
}
