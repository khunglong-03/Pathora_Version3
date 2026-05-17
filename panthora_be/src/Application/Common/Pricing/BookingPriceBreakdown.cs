namespace Application.Common.Pricing;

/// <summary>
/// Kết quả tính giá cho một booking — bao gồm đơn giá theo độ tuổi, subtotal, thuế, và số dư còn lại.
/// </summary>
public sealed record BookingPriceBreakdown(
    decimal AdultUnitPrice,
    decimal ChildUnitPrice,
    decimal InfantUnitPrice,
    decimal AdultSubtotal,
    decimal ChildSubtotal,
    decimal InfantSubtotal,
    decimal Subtotal,
    decimal TaxRate,
    decimal TaxAmount,
    decimal VisaServiceFeeTotal,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal RemainingBalance);
