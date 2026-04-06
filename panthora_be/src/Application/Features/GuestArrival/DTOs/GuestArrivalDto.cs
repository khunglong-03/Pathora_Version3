namespace Application.Features.GuestArrival.DTOs;

using Domain.Enums;

public sealed record GuestArrivalDto(
    Guid Id,
    Guid BookingAccommodationDetailId,
    Guid? SubmittedByUserId,
    DateTimeOffset? SubmittedAt,
    GuestArrivalSubmissionStatus SubmissionStatus,
    Guid? CheckedInByUserId,
    DateTimeOffset? ActualCheckInAt,
    Guid? CheckedOutByUserId,
    DateTimeOffset? ActualCheckOutAt,
    GuestStayStatus Status,
    string? Note,
    List<GuestArrivalParticipantDto> Participants);

public sealed record GuestArrivalParticipantDto(
    Guid Id,
    Guid BookingParticipantId,
    string? ParticipantName,
    string? PassportNumber);
