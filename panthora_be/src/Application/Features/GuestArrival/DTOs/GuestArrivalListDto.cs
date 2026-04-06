namespace Application.Features.GuestArrival.DTOs;

using Domain.Enums;

public sealed record GuestArrivalListDto(
    Guid Id,
    Guid BookingAccommodationDetailId,
    string? AccommodationName,
    GuestStayStatus Status,
    DateTimeOffset? CheckInDate,
    DateTimeOffset? CheckOutDate,
    int ParticipantCount,
    DateTimeOffset? SubmittedAt,
    GuestArrivalSubmissionStatus SubmissionStatus);
