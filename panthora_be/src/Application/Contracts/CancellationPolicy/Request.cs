using System.Text.Json.Serialization;
using Domain.Entities.Translations;
using Domain.Enums;
using Domain.ValueObjects;

namespace Application.Contracts.CancellationPolicy;

public sealed record CreateCancellationPolicyRequest(
    TourScope TourScope,
    List<CancellationPolicyTier> Tiers,
    [property: JsonPropertyName("translations")]
    Dictionary<string, CancellationPolicyTranslationData>? Translations = null
);

public sealed record UpdateCancellationPolicyRequest(
    Guid Id,
    TourScope TourScope,
    List<CancellationPolicyTier> Tiers,
    CancellationPolicyStatus Status = CancellationPolicyStatus.Active,
    [property: JsonPropertyName("translations")]
    Dictionary<string, CancellationPolicyTranslationData>? Translations = null
);

public sealed record CancellationPolicyResponse(
    Guid Id,
    string PolicyCode,
    TourScope TourScope,
    string TourScopeName,
    List<CancellationPolicyTier> Tiers,
    CancellationPolicyStatus Status,
    string StatusName,
    Dictionary<string, CancellationPolicyTranslationData> Translations,
    DateTimeOffset CreatedOnUtc,
    DateTimeOffset? LastModifiedOnUtc
);

public sealed record CalculateRefundRequest(
    Guid TourId,
    DateTimeOffset CancellationDate,
    decimal DepositAmount
);

public sealed record CalculateRefundResponse(
    decimal DepositAmount,
    int DaysBeforeDeparture,
    CancellationPolicyTier? MatchingTier,
    string? PolicyCode,
    decimal RefundAmount,
    decimal PenaltyAmount,
    CalculationStatus Status
);

public enum CalculationStatus
{
    Calculated,
    NoPolicyAssigned,
    NoTierMatch,
    AfterDeparture
}
