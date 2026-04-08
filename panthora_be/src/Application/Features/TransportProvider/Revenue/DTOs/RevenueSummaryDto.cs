namespace Application.Features.TransportProvider.Revenue.DTOs;

public sealed record RevenueSummaryDto(
    long TotalRevenue,
    int CompletedTrips,
    decimal AvgRevenuePerTrip,
    List<MonthlyRevenueDto> MonthlyBreakdown
);