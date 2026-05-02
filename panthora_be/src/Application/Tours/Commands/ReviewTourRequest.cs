using System.Text.Json.Serialization;

namespace Application.Tours.Commands;

public sealed record ReviewTourRequest(
    [property: JsonPropertyName("action")] TourReviewAction Action,
    [property: JsonPropertyName("reason")] string? Reason = null);