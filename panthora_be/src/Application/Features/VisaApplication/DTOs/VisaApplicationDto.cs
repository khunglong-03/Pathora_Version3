namespace Application.Features.VisaApplication.DTOs;

using Domain.Enums;

public sealed record VisaApplicationDto(
    Guid Id,
    Guid BookingParticipantId,
    string? ParticipantName,
    Guid PassportId,
    string? PassportNumber,
    string DestinationCountry,
    VisaStatus Status,
    DateTimeOffset? MinReturnDate,
    string? RefusalReason,
    string? VisaFileUrl,
    DateTimeOffset CreatedOnUtc,
    DateTimeOffset? LastModifiedOnUtc
);
