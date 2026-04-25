using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.TripAssignments.DTOs;
public sealed record AcceptTripAssignmentRequestDto(
    [property: JsonPropertyName("notes")] string? Notes = null
);
