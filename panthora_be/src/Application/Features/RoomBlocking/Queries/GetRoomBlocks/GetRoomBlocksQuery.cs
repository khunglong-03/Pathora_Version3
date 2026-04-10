namespace Application.Features.RoomBlocking.Queries.GetRoomBlocks;

using Application.Features.RoomBlocking.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;

public sealed record GetRoomBlocksQuery(
    Guid SupplierId,
    RoomType? RoomType = null,
    DateOnly? FromDate = null,
    DateOnly? ToDate = null,
    Guid? BlockId = null
) : IQuery<ErrorOr<List<RoomBlockDto>>>;
