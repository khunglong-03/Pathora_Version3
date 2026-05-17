using Application.Common.Pricing;
using Domain.Entities;
using Domain.ValueObjects;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Common.Pricing;

public sealed class BookingPriceCalculatorTests
{
    private readonly ILogger<BookingPriceCalculator> _logger = Substitute.For<ILogger<BookingPriceCalculator>>();
    private readonly BookingPriceCalculator _calculator;

    public BookingPriceCalculatorTests()
    {
        _calculator = new BookingPriceCalculator(_logger);
    }

    [Fact]
    public void Calculate_WithFullTiers_ReturnsCorrectBreakdown()
    {
        var tiers = new List<PricingPolicyTier>
        {
            new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 },
            new() { Label = "Child", AgeFrom = 2, AgeTo = 11, PricePercentage = 75 },
            new() { Label = "Infant", AgeFrom = 0, AgeTo = 1, PricePercentage = 0 }
        };
        var taxConfig = new TaxConfigEntity { TaxRate = 8m, IsActive = true };

        var breakdown = _calculator.Calculate(
            numberAdult: 2, numberChild: 1, numberInfant: 1,
            basePrice: 1_000_000m, tiers: tiers,
            taxConfig: taxConfig, visaServiceFeeTotal: 0m, paidAmount: 0m);

        Assert.Equal(1_000_000m, breakdown.AdultUnitPrice);
        Assert.Equal(750_000m, breakdown.ChildUnitPrice);
        Assert.Equal(0m, breakdown.InfantUnitPrice);
        Assert.Equal(2_000_000m, breakdown.AdultSubtotal);
        Assert.Equal(750_000m, breakdown.ChildSubtotal);
        Assert.Equal(0m, breakdown.InfantSubtotal);
        Assert.Equal(2_750_000m, breakdown.Subtotal);
        Assert.Equal(8m, breakdown.TaxRate);
        Assert.Equal(220_000m, breakdown.TaxAmount); // 2,750,000 * 8 / 100 = 220,000
        Assert.Equal(2_970_000m, breakdown.TotalAmount);
        Assert.Equal(2_970_000m, breakdown.RemainingBalance);
    }

    [Fact]
    public void Calculate_WithNullPolicy_FallsBackToBasePrice()
    {
        var taxConfig = new TaxConfigEntity { TaxRate = 0m, IsActive = true };

        var breakdown = _calculator.Calculate(
            numberAdult: 1, numberChild: 1, numberInfant: 0,
            basePrice: 500_000m, tiers: null,
            taxConfig: taxConfig, visaServiceFeeTotal: 0m, paidAmount: 0m);

        Assert.Equal(500_000m, breakdown.AdultUnitPrice);
        Assert.Equal(500_000m, breakdown.ChildUnitPrice);
        Assert.Equal(1_000_000m, breakdown.Subtotal);
        Assert.Equal(0m, breakdown.TaxAmount);
        Assert.Equal(1_000_000m, breakdown.TotalAmount);
    }

    [Fact]
    public void Calculate_WithNullTaxConfig_TaxAmountZeroAndWarningLogged()
    {
        var breakdown = _calculator.Calculate(
            numberAdult: 1, numberChild: 0, numberInfant: 0,
            basePrice: 1_000_000m, tiers: null,
            taxConfig: null, visaServiceFeeTotal: 0m, paidAmount: 0m);

        Assert.Equal(0m, breakdown.TaxRate);
        Assert.Equal(0m, breakdown.TaxAmount);
        Assert.Equal(1_000_000m, breakdown.TotalAmount);

        _logger.Received().Log(
            LogLevel.Warning,
            Arg.Any<EventId>(),
            Arg.Is<object>(o => o.ToString()!.Contains("No active TaxConfig")),
            Arg.Any<Exception>(),
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public void Calculate_WithVisaServiceFee_IncludesInTotal()
    {
        var taxConfig = new TaxConfigEntity { TaxRate = 0m, IsActive = true };

        var breakdown = _calculator.Calculate(
            numberAdult: 1, numberChild: 0, numberInfant: 0,
            basePrice: 1_000_000m, tiers: null,
            taxConfig: taxConfig, visaServiceFeeTotal: 150_000m, paidAmount: 0m);

        Assert.Equal(150_000m, breakdown.VisaServiceFeeTotal);
        Assert.Equal(1_150_000m, breakdown.TotalAmount);
    }

    [Fact]
    public void Calculate_TaxAmount_RoundsToEven()
    {
        var taxConfig = new TaxConfigEntity { TaxRate = 8m, IsActive = true };

        var breakdown = _calculator.Calculate(
            numberAdult: 1, numberChild: 0, numberInfant: 0,
            basePrice: 125m, tiers: null,
            taxConfig: taxConfig, visaServiceFeeTotal: 0m, paidAmount: 0m);

        // 125 * 8 / 100 = 10.0 → rounds to 10
        Assert.Equal(10m, breakdown.TaxAmount);
        Assert.Equal(135m, breakdown.TotalAmount);
    }

    [Fact]
    public void Calculate_PaidAmountExceedsTotal_RemainingBalanceZero()
    {
        var taxConfig = new TaxConfigEntity { TaxRate = 0m, IsActive = true };

        var breakdown = _calculator.Calculate(
            numberAdult: 1, numberChild: 0, numberInfant: 0,
            basePrice: 1_000_000m, tiers: null,
            taxConfig: taxConfig, visaServiceFeeTotal: 0m, paidAmount: 1_500_000m);

        Assert.Equal(1_000_000m, breakdown.TotalAmount);
        Assert.Equal(1_500_000m, breakdown.PaidAmount);
        Assert.Equal(0m, breakdown.RemainingBalance);
    }

    [Fact]
    public void ApplyPricingTier_WithMatchingTier_ReturnsAdjustedPrice()
    {
        var tiers = new List<PricingPolicyTier>
        {
            new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 },
            new() { Label = "Child", AgeFrom = 2, AgeTo = 11, PricePercentage = 75 }
        };

        var adult = BookingPriceCalculator.ApplyPricingTier(1_000_000m, tiers, 18);
        var child = BookingPriceCalculator.ApplyPricingTier(1_000_000m, tiers, 5);

        Assert.Equal(1_000_000m, adult);
        Assert.Equal(750_000m, child);
    }

    [Fact]
    public void ApplyPricingTier_WithEmptyTiers_ReturnsBasePrice()
    {
        var result = BookingPriceCalculator.ApplyPricingTier(500_000m, new List<PricingPolicyTier>(), 18);
        Assert.Equal(500_000m, result);
    }

    [Fact]
    public void ApplyPricingTier_WithNullTiers_ReturnsBasePrice()
    {
        var result = BookingPriceCalculator.ApplyPricingTier(500_000m, null, 18);
        Assert.Equal(500_000m, result);
    }

    [Fact]
    public void ApplyPricingTier_NoMatchingTier_ReturnsBasePrice()
    {
        var tiers = new List<PricingPolicyTier>
        {
            new() { Label = "Child", AgeFrom = 2, AgeTo = 11, PricePercentage = 75 }
        };

        var result = BookingPriceCalculator.ApplyPricingTier(1_000_000m, tiers, 18);
        Assert.Equal(1_000_000m, result);
    }
}
