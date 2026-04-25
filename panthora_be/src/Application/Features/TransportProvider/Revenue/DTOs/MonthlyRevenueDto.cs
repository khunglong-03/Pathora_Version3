using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.Revenue.DTOs;
public sealed record MonthlyRevenueDto(
    [property: JsonPropertyName("year")] int Year,
    [property: JsonPropertyName("month")] int Month,
    [property: JsonPropertyName("revenue")] long Revenue,
    [property: JsonPropertyName("trips")] int Trips
);