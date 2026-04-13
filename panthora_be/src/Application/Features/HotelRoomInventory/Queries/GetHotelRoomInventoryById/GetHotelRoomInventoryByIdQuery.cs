namespace Application.Features.HotelRoomInventory.Queries.GetHotelRoomInventoryById;

using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record GetHotelRoomInventoryByIdQuery(Guid Id) : IQuery<ErrorOr<HotelRoomInventoryDto>>;
