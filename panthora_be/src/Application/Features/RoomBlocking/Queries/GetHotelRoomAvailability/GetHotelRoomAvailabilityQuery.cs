namespace Application.Features.RoomBlocking.Queries.GetHotelRoomAvailability;

using Application.Features.RoomBlocking.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;

public sealed record GetHotelRoomAvailabilityQuery(
    Guid SupplierId,
    DateOnly FromDate,
    DateOnly ToDate
) : IQuery<ErrorOr<List<HotelRoomAvailabilityDto>>>;
