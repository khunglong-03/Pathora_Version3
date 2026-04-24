using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourInstanceStatsDto(
    [property: JsonPropertyName("totalInstances")] int TotalInstances,
    [property: JsonPropertyName("available")] int Available,
    [property: JsonPropertyName("confirmed")] int Confirmed,
    [property: JsonPropertyName("soldOut")] int SoldOut,
    [property: JsonPropertyName("completed")] int Completed);
