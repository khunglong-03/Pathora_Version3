using Application.Common.Constant;
using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.HotelRoomInventory.Queries.GetHotelRoomInventory;

public sealed record GetHotelRoomInventoryQuery([property: JsonPropertyName("supplierId")] Guid SupplierId) : IQuery<ErrorOr<List<HotelRoomInventoryDto>>>;

public sealed class GetHotelRoomInventoryQueryHandler(
    IHotelRoomInventoryRepository inventoryRepository,
    ISupplierRepository supplierRepository)
    : IQueryHandler<GetHotelRoomInventoryQuery, ErrorOr<List<HotelRoomInventoryDto>>>
{
    public async Task<ErrorOr<List<HotelRoomInventoryDto>>> Handle(
        GetHotelRoomInventoryQuery request,
        CancellationToken cancellationToken)
    {
        var supplier = await supplierRepository.GetByIdAsync(request.SupplierId);
        if (supplier is null)
        {
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);
        }

        var entities = await inventoryRepository.GetByHotelAsync(request.SupplierId);

        return entities.Select(e => new HotelRoomInventoryDto(
            e.Id,
            e.SupplierId,
            supplier.Name,
            e.RoomType,
            e.TotalRooms,
            e.Name,
            e.Address,
            e.LocationArea?.ToString(),
            e.OperatingCountries,
            e.ImageUrls,
            e.Notes)).ToList();
    }
}