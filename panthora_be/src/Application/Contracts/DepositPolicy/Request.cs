using BuildingBlocks.CORS;
using Domain.Entities.Translations;
using System.Text.Json.Serialization;

namespace Application.Contracts.DepositPolicy;

public sealed record DepositPolicyResponse(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourScope")] int TourScope,
    [property: JsonPropertyName("tourScopeName")] string TourScopeName,
    [property: JsonPropertyName("depositType")] int DepositType,
    [property: JsonPropertyName("depositTypeName")] string DepositTypeName,
    [property: JsonPropertyName("depositValue")] decimal DepositValue,
    [property: JsonPropertyName("minDaysBeforeDeparture")] int MinDaysBeforeDeparture,
    [property: JsonPropertyName("isActive")] bool IsActive,
    [property: JsonPropertyName("translations")] Dictionary<string, DepositPolicyTranslationData> Translations,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc);

public sealed record CreateDepositPolicyRequest(
    [property: JsonPropertyName("tourScope")] int TourScope,
    [property: JsonPropertyName("depositType")] int DepositType,
    [property: JsonPropertyName("depositValue")] decimal DepositValue,
    [property: JsonPropertyName("minDaysBeforeDeparture")] int MinDaysBeforeDeparture,
    [property: JsonPropertyName("translations")] Dictionary<string, DepositPolicyTranslationData>? Translations = null);

public sealed record UpdateDepositPolicyRequest(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourScope")] int TourScope,
    [property: JsonPropertyName("depositType")] int DepositType,
    [property: JsonPropertyName("depositValue")] decimal DepositValue,
    [property: JsonPropertyName("minDaysBeforeDeparture")] int MinDaysBeforeDeparture,
    [property: JsonPropertyName("isActive")] bool IsActive,
    [property: JsonPropertyName("translations")] Dictionary<string, DepositPolicyTranslationData>? Translations = null);
