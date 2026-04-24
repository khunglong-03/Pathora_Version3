namespace Application.Features.RoomBlocking.Queries.GetRoomBlocks;

using Application.Features.RoomBlocking.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetRoomBlocksQuery(
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("roomType")] RoomType? RoomType = null,
    [property: JsonPropertyName("fromDate")] DateOnly? FromDate = null,
    [property: JsonPropertyName("toDate")] DateOnly? ToDate = null,
    [property: JsonPropertyName("blockId")] Guid? BlockId = null) : IQuery<ErrorOr<List<RoomBlockDto>>>;
