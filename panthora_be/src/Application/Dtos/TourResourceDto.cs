using Domain.Entities;

namespace Application.Dtos;

public sealed record TourResourceDto(
    Guid Id,
    Guid TourId,
    Guid? FromLocationId,
    Guid? ToLocationId,
    TourPlanLocationDto? FromLocation,
    TourPlanLocationDto? ToLocation,
    TourResourceType Type,
    string Name,
    string? Description,
    string? Address,
    string? City,
    string? Country,
    string? ContactPhone,
    string? ContactEmail,
    decimal? EntranceFee,
    decimal? Price,
    string? PricingType,
    string? TransportationType,
    string? TransportationName,
    int? DurationMinutes,
    bool RequiresIndividualTicket,
    string? TicketInfo,
    string? CheckInTime,
    string? CheckOutTime,
    string? Note,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset? LastModifiedOnUtc
);
