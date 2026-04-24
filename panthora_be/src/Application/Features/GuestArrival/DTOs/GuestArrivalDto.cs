using System.Text.Json.Serialization;
using Domain.Enums;

namespace Application.Features.GuestArrival.DTOs;

public sealed record GuestArrivalDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("bookingAccommodationDetailId")] Guid BookingAccommodationDetailId,
    [property: JsonPropertyName("submittedByUserId")] Guid? SubmittedByUserId,
    [property: JsonPropertyName("submittedAt")] DateTimeOffset? SubmittedAt,
    [property: JsonPropertyName("submissionStatus")] GuestArrivalSubmissionStatus SubmissionStatus,
    [property: JsonPropertyName("checkedInByUserId")] Guid? CheckedInByUserId,
    [property: JsonPropertyName("actualCheckInAt")] DateTimeOffset? ActualCheckInAt,
    [property: JsonPropertyName("checkedOutByUserId")] Guid? CheckedOutByUserId,
    [property: JsonPropertyName("actualCheckOutAt")] DateTimeOffset? ActualCheckOutAt,
    [property: JsonPropertyName("status")] GuestStayStatus Status,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("participants")] List<GuestArrivalParticipantDto> Participants);

public sealed record GuestArrivalParticipantDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("bookingParticipantId")] Guid BookingParticipantId,
    [property: JsonPropertyName("participantName")] string? ParticipantName,
    [property: JsonPropertyName("passportNumber")] string? PassportNumber);
