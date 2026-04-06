namespace Domain.ValueObjects;

public class PricingPolicyTier
{
    public string Label { get; set; } = null!;
    public int AgeFrom { get; set; }
    public int? AgeTo { get; set; }
    public int PricePercentage { get; set; }
}
