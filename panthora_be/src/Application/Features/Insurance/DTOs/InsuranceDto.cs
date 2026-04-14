namespace Application.Features.Insurance.DTOs;

using Domain.Enums;

public sealed record InsuranceDto(
    Guid Id,
    string InsuranceName,
    InsuranceType InsuranceType,
    string InsuranceProvider,
    string CoverageDescription,
    decimal CoverageAmount,
    decimal CoverageFee,
    bool IsOptional,
    string? Note,
    Guid TourClassificationId,
    DateTimeOffset CreatedOnUtc,
    DateTimeOffset? LastModifiedOnUtc
);
