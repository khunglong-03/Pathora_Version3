namespace Application.Features.Admin.DTOs;

public sealed record TransportProviderStatsDto(
    int Total,
    int Active,
    int Inactive,
    int Pending,
    int Banned);
