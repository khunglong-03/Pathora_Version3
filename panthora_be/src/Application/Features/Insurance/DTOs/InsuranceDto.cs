namespace Application.Features.Insurance.DTOs;

using Domain.Enums;
using System.Text.Json.Serialization;

public sealed record InsuranceDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("insuranceName")] string InsuranceName,
    [property: JsonPropertyName("insuranceType")] InsuranceType InsuranceType,
    [property: JsonPropertyName("insuranceProvider")] string InsuranceProvider,
    [property: JsonPropertyName("coverageDescription")] string CoverageDescription,
    [property: JsonPropertyName("coverageAmount")] decimal CoverageAmount,
    [property: JsonPropertyName("coverageFee")] decimal CoverageFee,
    [property: JsonPropertyName("isOptional")] bool IsOptional,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("tourClassificationId")] Guid TourClassificationId,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc);
