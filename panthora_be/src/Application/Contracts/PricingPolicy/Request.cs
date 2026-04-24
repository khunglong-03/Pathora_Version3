using Domain.Entities.Translations;
using Domain.Enums;
using Domain.ValueObjects;
using System.Text.Json.Serialization;

namespace Application.Contracts.PricingPolicy;

public sealed record CreatePricingPolicyRequest(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("tourType")] TourType TourType,
    [property: JsonPropertyName("tiers")] List<PricingPolicyTier> Tiers,
    [property: JsonPropertyName("isDefault")] bool IsDefault = false,
    [property: JsonPropertyName("translations")] Dictionary<string, PricingPolicyTranslationData>? Translations = null
);

public sealed record UpdatePricingPolicyRequest(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("tourType")] TourType TourType,
    [property: JsonPropertyName("tiers")] List<PricingPolicyTier> Tiers,
    [property: JsonPropertyName("status")] PricingPolicyStatus? Status = null,
    [property: JsonPropertyName("translations")] Dictionary<string, PricingPolicyTranslationData>? Translations = null
);

public sealed record PricingPolicyResponse(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("policyCode")] string PolicyCode,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("tourType")] TourType TourType,
    [property: JsonPropertyName("tourTypeName")] string TourTypeName,
    [property: JsonPropertyName("status")] PricingPolicyStatus Status,
    [property: JsonPropertyName("statusName")] string StatusName,
    [property: JsonPropertyName("isDefault")] bool IsDefault,
    [property: JsonPropertyName("tiers")] List<PricingPolicyTier> Tiers,
    [property: JsonPropertyName("translations")] Dictionary<string, PricingPolicyTranslationData> Translations,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc
);

public sealed record SetDefaultPricingPolicyRequest([property: JsonPropertyName("id")] Guid Id);
