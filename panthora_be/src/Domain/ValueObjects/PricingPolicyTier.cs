using System.Text.Json.Serialization;

namespace Domain.ValueObjects;

public class PricingPolicyTier
{
    [JsonPropertyName("label")]
    public string Label { get; set; } = null!;

    [JsonPropertyName("ageFrom")]
    public int AgeFrom { get; set; }

    [JsonPropertyName("ageTo")]
    public int? AgeTo { get; set; }

    [JsonPropertyName("pricePercentage")]
    public int PricePercentage { get; set; }
}
