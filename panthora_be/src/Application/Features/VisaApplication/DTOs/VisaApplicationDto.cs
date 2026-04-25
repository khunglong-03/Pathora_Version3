using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.VisaApplication.DTOs;
public sealed record VisaApplicationDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("bookingParticipantId")] Guid BookingParticipantId,
    [property: JsonPropertyName("participantName")] string? ParticipantName,
    [property: JsonPropertyName("passportId")] Guid PassportId,
    [property: JsonPropertyName("passportNumber")] string? PassportNumber,
    [property: JsonPropertyName("destinationCountry")] string DestinationCountry,
    [property: JsonPropertyName("status")] VisaStatus Status,
    [property: JsonPropertyName("minReturnDate")] DateTimeOffset? MinReturnDate,
    [property: JsonPropertyName("refusalReason")] string? RefusalReason,
    [property: JsonPropertyName("visaFileUrl")] string? VisaFileUrl,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc);
