namespace Application.Features.Manager.DTOs;

public sealed record TourManagementStatsDto(
    int Total,
    int Active,
    int Inactive,
    int Rejected
);
