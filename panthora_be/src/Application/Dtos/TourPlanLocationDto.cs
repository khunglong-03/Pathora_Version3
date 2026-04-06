using Domain.Enums;

namespace Application.Dtos;

public sealed record TourPlanLocationDto(
    Guid Id,
    string LocationName,
    string? LocationDescription,
    LocationType LocationType,
    string? Address,
    string? City,
    string? Country,
    decimal? Latitude,
    decimal? Longitude,
    decimal? EntranceFee,
    TimeOnly? OpeningHours,
    TimeOnly? ClosingHours,
    int? EstimatedDurationMinutes,
    string? Note,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset? LastModifiedOnUtc
);
