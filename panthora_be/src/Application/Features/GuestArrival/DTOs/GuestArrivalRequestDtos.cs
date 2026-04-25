using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.GuestArrival.DTOs;
public sealed record CreateGuestArrivalRequestDto(
    [property: JsonPropertyName("bookingAccommodationDetailId")] Guid BookingAccommodationDetailId,
    [property: JsonPropertyName("participantIds")] List<Guid> ParticipantIds);

public sealed record UpdateGuestArrivalRequestDto(
    [property: JsonPropertyName("submissionStatus")] GuestArrivalSubmissionStatus? SubmissionStatus,
    [property: JsonPropertyName("status")] GuestStayStatus? Status,
    [property: JsonPropertyName("checkedInByUserId")] Guid? CheckedInByUserId,
    [property: JsonPropertyName("actualCheckInAt")] DateTimeOffset? ActualCheckInAt,
    [property: JsonPropertyName("checkedOutByUserId")] Guid? CheckedOutByUserId,
    [property: JsonPropertyName("actualCheckOutAt")] DateTimeOffset? ActualCheckOutAt,
    [property: JsonPropertyName("note")] string? Note);
