using Domain.Entities.Translations;
using Domain.Enums;
using Domain.ValueObjects;
using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record PricingPolicyDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("policyCode")] string PolicyCode,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("tiers")] List<PricingPolicyTier> Tiers
);
