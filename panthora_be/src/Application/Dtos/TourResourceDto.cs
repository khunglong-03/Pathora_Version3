using Domain.Entities;
using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourResourceDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourId")] Guid TourId,
    [property: JsonPropertyName("fromLocationId")] Guid? FromLocationId,
    [property: JsonPropertyName("toLocationId")] Guid? ToLocationId,
    [property: JsonPropertyName("fromLocation")] TourPlanLocationDto? FromLocation,
    [property: JsonPropertyName("toLocation")] TourPlanLocationDto? ToLocation,
    [property: JsonPropertyName("type")] TourResourceType Type,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("city")] string? City,
    [property: JsonPropertyName("country")] string? Country,
    [property: JsonPropertyName("contactPhone")] string? ContactPhone,
    [property: JsonPropertyName("contactEmail")] string? ContactEmail,
    [property: JsonPropertyName("entranceFee")] decimal? EntranceFee,
    [property: JsonPropertyName("price")] decimal? Price,
    [property: JsonPropertyName("pricingType")] string? PricingType,
    [property: JsonPropertyName("transportationType")] string? TransportationType,
    [property: JsonPropertyName("transportationName")] string? TransportationName,
    [property: JsonPropertyName("durationMinutes")] int? DurationMinutes,
    [property: JsonPropertyName("requiresIndividualTicket")] bool RequiresIndividualTicket,
    [property: JsonPropertyName("ticketInfo")] string? TicketInfo,
    [property: JsonPropertyName("checkInTime")] string? CheckInTime,
    [property: JsonPropertyName("checkOutTime")] string? CheckOutTime,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("createdBy")] string? CreatedBy,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedBy")] string? LastModifiedBy,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc
);
