using Domain.Entities.Translations;
using Domain.Enums;

namespace Application.Dtos;

public sealed record TourInsuranceDto(
    Guid Id,
    string InsuranceName,
    InsuranceType InsuranceType,
    string InsuranceProvider,
    string CoverageDescription,
    decimal CoverageAmount,
    decimal CoverageFee,
    bool IsOptional,
    string? Note,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset? LastModifiedOnUtc,
    Dictionary<string, TourClassificationTranslationData>? Translations = null
);
