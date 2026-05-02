using Domain.Entities.Translations;
using Domain.Enums;
using Domain.ValueObjects;
using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record CancellationPolicyDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("policyCode")] string PolicyCode,
    [property: JsonPropertyName("tiers")] List<CancellationPolicyTier> Tiers
);
