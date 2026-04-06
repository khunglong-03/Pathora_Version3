using Domain.Entities.Translations;
using Domain.Enums;
using Domain.ValueObjects;

namespace Application.Contracts.PricingPolicy;

public sealed record CreatePricingPolicyRequest(
    string Name,
    TourType TourType,
    List<PricingPolicyTier> Tiers,
    bool IsDefault = false,
    Dictionary<string, PricingPolicyTranslationData>? Translations = null
);

public sealed record UpdatePricingPolicyRequest(
    Guid Id,
    string Name,
    TourType TourType,
    List<PricingPolicyTier> Tiers,
    PricingPolicyStatus? Status = null,
    Dictionary<string, PricingPolicyTranslationData>? Translations = null
);

public sealed record PricingPolicyResponse(
    Guid Id,
    string PolicyCode,
    string Name,
    TourType TourType,
    string TourTypeName,
    PricingPolicyStatus Status,
    string StatusName,
    bool IsDefault,
    List<PricingPolicyTier> Tiers,
    Dictionary<string, PricingPolicyTranslationData> Translations,
    DateTimeOffset CreatedOnUtc,
    DateTimeOffset? LastModifiedOnUtc
);

public sealed record SetDefaultPricingPolicyRequest(Guid Id);
