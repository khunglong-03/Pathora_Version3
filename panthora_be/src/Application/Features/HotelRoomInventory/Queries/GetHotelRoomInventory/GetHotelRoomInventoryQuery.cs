namespace Application.Features.HotelRoomInventory.Queries.GetHotelRoomInventory;

using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record GetHotelRoomInventoryQuery(Guid SupplierId) : IQuery<ErrorOr<List<HotelRoomInventoryDto>>>;