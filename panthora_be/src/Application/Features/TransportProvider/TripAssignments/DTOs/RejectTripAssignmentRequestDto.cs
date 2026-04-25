using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.TripAssignments.DTOs;
public sealed record RejectTripAssignmentRequestDto(
    [property: JsonPropertyName("reason")] string Reason
);
