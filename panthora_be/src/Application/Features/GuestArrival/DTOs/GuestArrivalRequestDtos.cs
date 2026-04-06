namespace Application.Features.GuestArrival.DTOs;

using Domain.Enums;

public sealed record CreateGuestArrivalRequestDto(
    Guid BookingAccommodationDetailId,
    List<Guid> ParticipantIds);

public sealed record UpdateGuestArrivalRequestDto(
    GuestArrivalSubmissionStatus? SubmissionStatus,
    GuestStayStatus? Status,
    Guid? CheckedInByUserId,
    DateTimeOffset? ActualCheckInAt,
    Guid? CheckedOutByUserId,
    DateTimeOffset? ActualCheckOutAt,
    string? Note);
