using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;

namespace Domain.Specs.Application.Validators;

public class PricingCalculationTests
{
    private static PricingPolicy CreatePolicy(params (int ageFrom, int? ageTo, int percentage)[] tiers)
    {
        return new PricingPolicy
        {
            Id = Guid.NewGuid(),
            PolicyCode = "TEST-PP",
            Name = "Test Policy",
            TourType = TourType.Public,
            Status = PricingPolicyStatus.Active,
            Tiers = tiers.Select(t => new PricingPolicyTier
            {
                Label = $"Tier-{t.ageFrom}",
                AgeFrom = t.ageFrom,
                AgeTo = t.ageTo,
                PricePercentage = t.percentage
            }).ToList()
        };
    }

    [Fact]
    public void ApplyPricingTier_adult_age_returns_100_percent()
    {
        // Arrange
        var policy = CreatePolicy((18, null, 100));
        var basePrice = 100m;

        // Act
        var result = ApplyPricingTier(basePrice, policy.Tiers, 18);

        // Assert
        Assert.Equal(100m, result);
    }

    [Fact]
    public void ApplyPricingTier_child_age_returns_75_percent()
    {
        // Arrange
        var policy = CreatePolicy((0, 17, 75));
        var basePrice = 100m;

        // Act
        var result = ApplyPricingTier(basePrice, policy.Tiers, 10);

        // Assert
        Assert.Equal(75m, result);
    }

    [Fact]
    public void ApplyPricingTier_infant_age_returns_25_percent()
    {
        // Arrange
        var policy = CreatePolicy((0, 1, 25));
        var basePrice = 100m;

        // Act
        var result = ApplyPricingTier(basePrice, policy.Tiers, 1);

        // Assert
        Assert.Equal(25m, result);
    }

    [Fact]
    public void ApplyPricingTier_no_matching_tier_returns_base_price()
    {
        // Arrange
        var policy = CreatePolicy((18, null, 100)); // only adult tier
        var basePrice = 100m;

        // Act
        var result = ApplyPricingTier(basePrice, policy.Tiers, 5); // child age

        // Assert
        Assert.Equal(100m, result); // default 100%
    }

    [Fact]
    public void ApplyPricingTier_no_policy_returns_base_price()
    {
        // Arrange
        var tiers = new List<PricingPolicyTier>(); // empty
        var basePrice = 100m;

        // Act
        var result = ApplyPricingTier(basePrice, tiers, 18);

        // Assert
        Assert.Equal(100m, result);
    }

    [Fact]
    public void ApplyPricingTier_base_price_zero_returns_zero()
    {
        // Arrange
        var policy = CreatePolicy((18, null, 100));
        var basePrice = 0m;

        // Act
        var result = ApplyPricingTier(basePrice, policy.Tiers, 18);

        // Assert
        Assert.Equal(0m, result);
    }

    [Fact]
    public void ApplyPricingTier_overlapping_tiers_uses_first_match()
    {
        // Arrange — overlapping tiers, adult (0-100) and child (0-17)
        var policy = new PricingPolicy
        {
            Tiers = new List<PricingPolicyTier>
            {
                new() { Label = "Adult", AgeFrom = 0, AgeTo = null, PricePercentage = 100 }, // first — should match
                new() { Label = "Child", AgeFrom = 0, AgeTo = 17, PricePercentage = 75 }     // second — never reached
            }
        };
        var basePrice = 100m;

        // Act
        var result = ApplyPricingTier(basePrice, policy.Tiers, 5); // child age

        // Assert
        Assert.Equal(100m, result); // first matching tier wins
    }

    // Helper — mirrors the exact logic in GetCheckoutPriceQuery
    private static decimal ApplyPricingTier(decimal basePrice, List<PricingPolicyTier> tiers, int age)
    {
        foreach (var tier in tiers)
        {
            if (age >= tier.AgeFrom && (!tier.AgeTo.HasValue || age <= tier.AgeTo.Value))
            {
                return basePrice * tier.PricePercentage / 100m;
            }
        }
        return basePrice;
    }
}
