using System.Text.Json.Serialization;

namespace Application.Features.Admin.DTOs;
public sealed record TransportProviderStatsDto(
    [property: JsonPropertyName("total")] int Total,
    [property: JsonPropertyName("active")] int Active,
    [property: JsonPropertyName("inactive")] int Inactive,
    [property: JsonPropertyName("pending")] int Pending,
    [property: JsonPropertyName("banned")] int Banned);
