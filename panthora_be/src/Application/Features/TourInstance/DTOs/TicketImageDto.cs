using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.DTOs;

public sealed record TicketImageDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourInstanceDayActivityId")] Guid TourInstanceDayActivityId,
    [property: JsonPropertyName("imageUrl")] string? ImageUrl,
    [property: JsonPropertyName("originalFileName")] string? OriginalFileName,
    [property: JsonPropertyName("uploadedBy")] string UploadedBy,
    [property: JsonPropertyName("uploadedAt")] DateTimeOffset UploadedAt,
    [property: JsonPropertyName("bookingId")] Guid? BookingId,
    [property: JsonPropertyName("bookingReference")] string? BookingReference,
    [property: JsonPropertyName("note")] string? Note);
