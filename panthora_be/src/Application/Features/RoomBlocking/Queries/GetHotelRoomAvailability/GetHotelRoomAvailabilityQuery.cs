namespace Application.Features.RoomBlocking.Queries.GetHotelRoomAvailability;

using Application.Features.RoomBlocking.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetHotelRoomAvailabilityQuery(
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("fromDate")] DateOnly FromDate,
    [property: JsonPropertyName("toDate")] DateOnly ToDate) : IQuery<ErrorOr<List<HotelRoomAvailabilityDto>>>;
