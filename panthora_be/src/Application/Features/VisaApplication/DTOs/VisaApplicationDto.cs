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
    [property: JsonPropertyName("isSystemAssisted")] bool IsSystemAssisted,
    [property: JsonPropertyName("serviceFee")] decimal? ServiceFee,
    [property: JsonPropertyName("serviceFeePaidAt")] DateTimeOffset? ServiceFeePaidAt,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc,
    [property: JsonPropertyName("visaNumber")] string? VisaNumber = null,
    [property: JsonPropertyName("entryType")] VisaEntryType? EntryType = null,
    [property: JsonPropertyName("issuedAt")] DateTimeOffset? IssuedAt = null,
    [property: JsonPropertyName("expiresAt")] DateTimeOffset? ExpiresAt = null,
    [property: JsonPropertyName("category")] VisaCategory? Category = null,
    [property: JsonPropertyName("format")] VisaFormat? Format = null,
    [property: JsonPropertyName("maxStayDays")] int? MaxStayDays = null,
    [property: JsonPropertyName("issuingAuthority")] string? IssuingAuthority = null);
