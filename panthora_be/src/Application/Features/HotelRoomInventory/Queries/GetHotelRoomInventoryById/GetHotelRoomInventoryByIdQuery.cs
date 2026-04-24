namespace Application.Features.HotelRoomInventory.Queries.GetHotelRoomInventoryById;

using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetHotelRoomInventoryByIdQuery([property: JsonPropertyName("id")] Guid Id) : IQuery<ErrorOr<HotelRoomInventoryDto>>;
