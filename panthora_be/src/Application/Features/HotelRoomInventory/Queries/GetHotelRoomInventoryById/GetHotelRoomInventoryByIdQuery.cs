using Application.Common.Constant;
using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.HotelRoomInventory.Queries.GetHotelRoomInventoryById;

public sealed record GetHotelRoomInventoryByIdQuery([property: JsonPropertyName("id")] Guid Id) : IQuery<ErrorOr<HotelRoomInventoryDto>>;


public sealed class GetHotelRoomInventoryByIdQueryHandler(
    IHotelRoomInventoryRepository inventoryRepository,
    ISupplierRepository supplierRepository)
    : IQueryHandler<GetHotelRoomInventoryByIdQuery, ErrorOr<HotelRoomInventoryDto>>
{
    public async Task<ErrorOr<HotelRoomInventoryDto>> Handle(
        GetHotelRoomInventoryByIdQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await inventoryRepository.FindByIdAsync(request.Id, cancellationToken);
        if (entity is null)
        {
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);
        }

        var supplier = await supplierRepository.GetByIdAsync(entity.SupplierId, cancellationToken);

        return new HotelRoomInventoryDto(
            entity.Id,
            entity.SupplierId,
            supplier?.Name,
            entity.RoomType,
            entity.TotalRooms,
            entity.Name,
            entity.Address,
            entity.LocationArea?.ToString(),
            entity.OperatingCountries,
            entity.Thumbnail is not null ? new Application.Dtos.ImageDto(entity.Thumbnail.FileId, entity.Thumbnail.OriginalFileName, entity.Thumbnail.FileName, entity.Thumbnail.PublicURL) : null,
            entity.Images?.Select(i => new Application.Dtos.ImageDto(i.FileId, i.OriginalFileName, i.FileName, i.PublicURL)).ToList(),
            entity.Notes);
    }
}
