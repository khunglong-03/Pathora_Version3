namespace Application.Dtos;

public sealed record TourInstanceStatsDto(
    int TotalInstances,
    int Available,
    int Confirmed,
    int SoldOut);
