using Domain.Entities;
using Domain.ValueObjects;
using Microsoft.Extensions.Logging;

namespace Application.Common.Pricing;

public interface IBookingPriceCalculator
{
    /// <summary>
    /// Tính giá breakdown cho một booking từ các tham số rời rạc.
    /// </summary>
    BookingPriceBreakdown Calculate(
        int numberAdult,
        int numberChild,
        int numberInfant,
        decimal basePrice,
        IReadOnlyList<PricingPolicyTier>? tiers,
        TaxConfigEntity? taxConfig,
        decimal visaServiceFeeTotal,
        decimal paidAmount);

    /// <summary>
    /// Tiện lợi: tính breakdown từ entity booking + tour instance.
    /// </summary>
    BookingPriceBreakdown Calculate(
        BookingEntity booking,
        TourInstanceEntity instance,
        IReadOnlyList<PricingPolicyTier>? tiers,
        TaxConfigEntity? taxConfig,
        decimal paidAmount);
}

public sealed class BookingPriceCalculator : IBookingPriceCalculator
{
    private readonly ILogger<BookingPriceCalculator> _logger;

    public BookingPriceCalculator(ILogger<BookingPriceCalculator> logger)
    {
        _logger = logger;
    }

    public BookingPriceBreakdown Calculate(
        int numberAdult,
        int numberChild,
        int numberInfant,
        decimal basePrice,
        IReadOnlyList<PricingPolicyTier>? tiers,
        TaxConfigEntity? taxConfig,
        decimal visaServiceFeeTotal,
        decimal paidAmount)
    {
        var adultUnitPrice = ApplyPricingTier(basePrice, tiers, 18);
        var childUnitPrice = ApplyPricingTier(basePrice, tiers, 5);
        var infantUnitPrice = ApplyPricingTier(basePrice, tiers, 1);

        var adultSubtotal = adultUnitPrice * numberAdult;
        var childSubtotal = childUnitPrice * numberChild;
        var infantSubtotal = infantUnitPrice * numberInfant;
        var subtotal = adultSubtotal + childSubtotal + infantSubtotal;

        var taxRate = taxConfig?.TaxRate ?? 0m;
        if (taxConfig == null)
        {
            _logger.LogWarning(
                "No active TaxConfig found — taxAmount will be 0 for booking with basePrice {BasePrice}",
                basePrice);
        }

        var taxAmount = decimal.Round(subtotal * taxRate / 100m, 0, MidpointRounding.ToEven);
        var totalAmount = subtotal + taxAmount + visaServiceFeeTotal;
        var remainingBalance = Math.Max(0m, totalAmount - paidAmount);

        return new BookingPriceBreakdown(
            AdultUnitPrice: adultUnitPrice,
            ChildUnitPrice: childUnitPrice,
            InfantUnitPrice: infantUnitPrice,
            AdultSubtotal: adultSubtotal,
            ChildSubtotal: childSubtotal,
            InfantSubtotal: infantSubtotal,
            Subtotal: subtotal,
            TaxRate: taxRate,
            TaxAmount: taxAmount,
            VisaServiceFeeTotal: visaServiceFeeTotal,
            TotalAmount: totalAmount,
            PaidAmount: paidAmount,
            RemainingBalance: remainingBalance);
    }

    public BookingPriceBreakdown Calculate(
        BookingEntity booking,
        TourInstanceEntity instance,
        IReadOnlyList<PricingPolicyTier>? tiers,
        TaxConfigEntity? taxConfig,
        decimal paidAmount)
    {
        return Calculate(
            numberAdult: booking.NumberAdult,
            numberChild: booking.NumberChild,
            numberInfant: booking.NumberInfant,
            basePrice: instance.BasePrice,
            tiers: tiers,
            taxConfig: taxConfig,
            visaServiceFeeTotal: booking.VisaServiceFeeTotal,
            paidAmount: paidAmount);
    }

    /// <summary>
    /// Áp dụng pricing tier theo độ tuổi. Trả về pricePercentage / 100 * basePrice nếu tìm thấy tier phù hợp.
    /// </summary>
    public static decimal ApplyPricingTier(decimal basePrice, IReadOnlyList<PricingPolicyTier>? tiers, int age)
    {
        if (tiers == null || tiers.Count == 0)
            return basePrice;

        foreach (var tier in tiers)
        {
            if (age >= tier.AgeFrom && (!tier.AgeTo.HasValue || age <= tier.AgeTo.Value))
                return basePrice * tier.PricePercentage / 100m;
        }

        return basePrice;
    }
}
