namespace Application.Features.HotelRoomInventory.Queries.GetHotelRoomInventory;

using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetHotelRoomInventoryQuery([property: JsonPropertyName("supplierId")] Guid SupplierId) : IQuery<ErrorOr<List<HotelRoomInventoryDto>>>;