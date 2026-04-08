namespace Application.Features.TransportProvider.Revenue.DTOs;

public sealed record MonthlyRevenueDto(
    int Year,
    int Month,
    long Revenue,
    int Trips
);