namespace Application.Features.HotelServiceProvider.Accommodations.Queries;

using Application.Common.Constant;
using Application.Features.HotelServiceProvider.Accommodations.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed class GetAccommodationsQueryHandler(
    IHotelRoomInventoryRepository inventoryRepository,
    ISupplierRepository supplierRepository,
    IUser user)
    : IQueryHandler<GetAccommodationsQuery, ErrorOr<List<AccommodationDto>>>
{
    public async Task<ErrorOr<List<AccommodationDto>>> Handle(
        GetAccommodationsQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = user.Id;
        if (currentUserId is null)
            return Error.Unauthorized();

        var supplier = await supplierRepository.FindByOwnerUserIdAsync(Guid.Parse(currentUserId));

        if (supplier is null)
            return new List<AccommodationDto>();

        var entities = await inventoryRepository.GetByHotelAsync(supplier.Id);

        return entities.Select(MapToDto).ToList();
    }

    private static AccommodationDto MapToDto(HotelRoomInventoryEntity e)
    {
        return new AccommodationDto(
            e.Id,
            e.SupplierId,
            e.RoomType,
            e.TotalRooms,
            e.Name,
            e.Address,
            e.LocationArea?.ToString(),
            e.OperatingCountries,
            e.ImageUrls,
            e.Notes);
    }
}
