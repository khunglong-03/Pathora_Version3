using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.Revenue.DTOs;

public sealed record RevenueSummaryDto(
    [property: JsonPropertyName("totalRevenue")] long TotalRevenue,
    [property: JsonPropertyName("completedTrips")] int CompletedTrips,
    [property: JsonPropertyName("avgRevenuePerTrip")] decimal AvgRevenuePerTrip,
    [property: JsonPropertyName("monthlyBreakdown")] List<MonthlyRevenueDto> MonthlyBreakdown
);