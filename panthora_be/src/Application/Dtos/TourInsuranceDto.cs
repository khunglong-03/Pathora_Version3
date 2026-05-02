using Domain.Entities.Translations;
using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourInsuranceDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("insuranceName")] string InsuranceName,
    [property: JsonPropertyName("insuranceType")] InsuranceType InsuranceType,
    [property: JsonPropertyName("insuranceProvider")] string InsuranceProvider,
    [property: JsonPropertyName("coverageDescription")] string CoverageDescription,
    [property: JsonPropertyName("coverageAmount")] decimal CoverageAmount,
    [property: JsonPropertyName("coverageFee")] decimal CoverageFee,
    [property: JsonPropertyName("isOptional")] bool IsOptional,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("createdBy")] string? CreatedBy,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedBy")] string? LastModifiedBy,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc,
    [property: JsonPropertyName("translations")] Dictionary<string, TourClassificationTranslationData>? Translations = null
);
