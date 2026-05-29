namespace Application.Features.BookingManagement.DTOs;

using System;
using System.Collections.Generic;

public sealed record TourGuideManifestDto(
    Guid TourInstanceId,
    DateTimeOffset GeneratedAt,
    List<TourGuideManifestBookingDto> Bookings);

public sealed record TourGuideManifestBookingDto(
    Guid BookingId,
    string Reference,
    int Adults,
    int Children,
    int Infants,
    List<TourGuideManifestParticipantDto> Participants);

public sealed record TourGuideManifestParticipantDto(
    Guid ParticipantId,
    string FullName,
    string ParticipantType,
    DateTimeOffset? DateOfBirth,
    string? Gender,
    string? Nationality);
