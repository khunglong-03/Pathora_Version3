using Application.Common.Constant;
using Application.Features.RoomBlocking.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using IRoomBlockRepository = Domain.Common.Repositories.IRoomBlockRepository;
using System.Text.Json.Serialization;

namespace Application.Features.RoomBlocking.Queries.GetRoomBlocks;

public sealed record GetRoomBlocksQuery(
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("roomType")] RoomType? RoomType = null,
    [property: JsonPropertyName("fromDate")] DateOnly? FromDate = null,
    [property: JsonPropertyName("toDate")] DateOnly? ToDate = null,
    [property: JsonPropertyName("blockId")] Guid? BlockId = null) : IQuery<ErrorOr<List<RoomBlockDto>>>;


public sealed class GetRoomBlocksQueryHandler(
    IRoomBlockRepository roomBlockRepository,
    ISupplierRepository supplierRepository)
    : IQueryHandler<GetRoomBlocksQuery, ErrorOr<List<RoomBlockDto>>>
{
    public async Task<ErrorOr<List<RoomBlockDto>>> Handle(
        GetRoomBlocksQuery request,
        CancellationToken cancellationToken)
    {
        if (request.BlockId.HasValue)
        {
            var block = await roomBlockRepository.FindByIdAsync(request.BlockId.Value, cancellationToken);
            if (block is null)
            {
                return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);
            }

            var supplierForBlock = await supplierRepository.GetByIdAsync(block.SupplierId, cancellationToken);
            return new List<RoomBlockDto>
            {
                new(
                    block.Id,
                    block.SupplierId,
                    supplierForBlock?.Name,
                    block.RoomType,
                    block.BookingAccommodationDetailId,
                    block.BookingId,
                    block.BlockedDate,
                    block.RoomCountBlocked,
                    block.CreatedOnUtc)
            };
        }

        var supplier = await supplierRepository.GetByIdAsync(request.SupplierId);
        if (supplier is null)
        {
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);
        }

        IReadOnlyList<Domain.Entities.RoomBlockEntity> entities;

        if (request.RoomType.HasValue && request.FromDate.HasValue && request.ToDate.HasValue)
        {
            entities = await roomBlockRepository.GetByDateRangeAsync(
                request.SupplierId, request.RoomType.Value, request.FromDate.Value, request.ToDate.Value, cancellationToken);
        }
        else
        {
            entities = await roomBlockRepository.GetBySupplierAsync(request.SupplierId, cancellationToken);
        }

        return entities.Select(e => new RoomBlockDto(
            e.Id,
            e.SupplierId,
            supplier.Name,
            e.RoomType,
            e.BookingAccommodationDetailId,
            e.BookingId,
            e.BlockedDate,
            e.RoomCountBlocked,
            e.CreatedOnUtc)).ToList();
    }
}
