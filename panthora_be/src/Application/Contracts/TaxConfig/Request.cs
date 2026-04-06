using BuildingBlocks.CORS;

namespace Application.Contracts.TaxConfig;

public sealed record TaxConfigResponse(
    Guid Id,
    string TaxName,
    string? TaxCode,
    decimal TaxRate,
    string? Description,
    bool IsActive,
    DateTimeOffset EffectiveDate,
    string? CreatedBy,
    string? LastModifiedBy,
    DateTimeOffset CreatedOnUtc,
    DateTimeOffset? LastModifiedOnUtc
);

public sealed record CreateTaxConfigRequest(
    string TaxName,
    decimal TaxRate,
    string? Description,
    DateTimeOffset EffectiveDate
);

public sealed record UpdateTaxConfigRequest(
    Guid Id,
    string TaxName,
    decimal TaxRate,
    string? Description,
    DateTimeOffset EffectiveDate,
    bool IsActive
);
