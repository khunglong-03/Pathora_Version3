using BuildingBlocks.CORS;
using Domain.Entities.Translations;

namespace Application.Contracts.DepositPolicy;

public sealed record DepositPolicyResponse(
    Guid Id,
    int TourScope,
    string TourScopeName,
    int DepositType,
    string DepositTypeName,
    decimal DepositValue,
    int MinDaysBeforeDeparture,
    bool IsActive,
    Dictionary<string, DepositPolicyTranslationData> Translations,
    DateTimeOffset CreatedOnUtc,
    DateTimeOffset? LastModifiedOnUtc
);

public sealed record CreateDepositPolicyRequest(
    int TourScope,
    int DepositType,
    decimal DepositValue,
    int MinDaysBeforeDeparture,
    Dictionary<string, DepositPolicyTranslationData>? Translations = null
);

public sealed record UpdateDepositPolicyRequest(
    Guid Id,
    int TourScope,
    int DepositType,
    decimal DepositValue,
    int MinDaysBeforeDeparture,
    bool IsActive,
    Dictionary<string, DepositPolicyTranslationData>? Translations = null
);
