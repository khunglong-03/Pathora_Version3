using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.TripAssignments.DTOs;
public sealed record UpdateTripStatusRequestDto(
    [property: JsonPropertyName("status")] string Status
);
