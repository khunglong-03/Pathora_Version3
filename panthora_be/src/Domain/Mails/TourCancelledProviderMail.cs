namespace Domain.Mails;

/// <summary>
/// Email thông báo cho nhà cung cấp dịch vụ (nhà xe, khách sạn) khi tour bị huỷ.
/// </summary>
[Mail("Tour bị huỷ - Thông báo từ Pathora", "tour-cancelled-provider")]
public sealed record TourCancelledProviderMail(
    string ProviderName,
    string TourName,
    string TourCode,
    string StartDate,
    string EndDate,
    string HotlinePhone);
