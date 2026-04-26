using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.GuestArrival.DTOs;

public sealed record GuestArrivalListDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("bookingAccommodationDetailId")] Guid BookingAccommodationDetailId,
    [property: JsonPropertyName("accommodationName")] string? AccommodationName,
    [property: JsonPropertyName("status")] GuestStayStatus Status,
    [property: JsonPropertyName("checkInDate")] DateTimeOffset? CheckInDate,
    [property: JsonPropertyName("checkOutDate")] DateTimeOffset? CheckOutDate,
    [property: JsonPropertyName("participantCount")] int ParticipantCount,
    [property: JsonPropertyName("submittedAt")] DateTimeOffset? SubmittedAt,
    [property: JsonPropertyName("submissionStatus")] GuestArrivalSubmissionStatus SubmissionStatus);
