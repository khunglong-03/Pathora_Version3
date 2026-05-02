using BuildingBlocks.CORS;
using System.Text.Json.Serialization;

namespace Application.Contracts.TaxConfig;

public sealed record TaxConfigResponse(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("taxName")] string TaxName,
    [property: JsonPropertyName("taxCode")] string? TaxCode,
    [property: JsonPropertyName("taxRate")] decimal TaxRate,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("isActive")] bool IsActive,
    [property: JsonPropertyName("effectiveDate")] DateTimeOffset EffectiveDate,
    [property: JsonPropertyName("createdBy")] string? CreatedBy,
    [property: JsonPropertyName("lastModifiedBy")] string? LastModifiedBy,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc
);

public sealed record CreateTaxConfigRequest(
    [property: JsonPropertyName("taxName")] string TaxName,
    [property: JsonPropertyName("taxRate")] decimal TaxRate,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("effectiveDate")] DateTimeOffset EffectiveDate
);

public sealed record UpdateTaxConfigRequest(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("taxName")] string TaxName,
    [property: JsonPropertyName("taxRate")] decimal TaxRate,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("effectiveDate")] DateTimeOffset EffectiveDate,
    [property: JsonPropertyName("isActive")] bool IsActive
);
