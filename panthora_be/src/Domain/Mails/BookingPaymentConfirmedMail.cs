namespace Domain.Mails;

/// <summary>
/// Email xác nhận gửi cho khách hàng sau khi thanh toán thành công.
/// Áp dụng cho cả đặt cọc (Deposit) lẫn thanh toán toàn phần (FullPayment).
/// </summary>
[Mail("[Pathora] Xác nhận thanh toán đặt tour thành công", "booking-payment-confirmed")]
public sealed record BookingPaymentConfirmedMail(
    string CustomerName,
    string BookingCode,
    string TourName,
    string DepartureDate,
    /// <summary>"Đặt cọc" hoặc "Toàn phần"</summary>
    string PaymentType,
    string PaidAmount,
    string BookingDetailLink,
    string HotlinePhone);
