using System.Text.Json.Serialization;

namespace Application.Features.Manager.DTOs;
public sealed record TourManagementStatsDto(
    [property: JsonPropertyName("total")] int Total,
    [property: JsonPropertyName("active")] int Active,
    [property: JsonPropertyName("inactive")] int Inactive,
    [property: JsonPropertyName("rejected")] int Rejected
);
