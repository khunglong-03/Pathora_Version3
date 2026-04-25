using Application.Common.Constant;
using Application.Features.HotelServiceProvider.Accommodations.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using global::Contracts.Interfaces;

namespace Application.Features.HotelServiceProvider.Accommodations.Queries;
public sealed record GetAccommodationsQuery : IQuery<ErrorOr<List<AccommodationDto>>>;


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

        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(Guid.Parse(currentUserId));

        if (suppliers.Count == 0)
            return new List<AccommodationDto>();

        var supplierIds = suppliers.Select(s => s.Id).ToList();
        var entities = await inventoryRepository.GetByHotelIdsAsync(supplierIds);

        return entities.Select(MapToDto).ToList();
    }

    private static AccommodationDto MapToDto(HotelRoomInventoryEntity e)
    {
        return new AccommodationDto(
            e.Id,
            e.SupplierId,
            e.RoomType.ToString(),
            e.TotalRooms,
            e.Name,
            e.Address,
            e.LocationArea?.ToString(),
            e.OperatingCountries,
            !string.IsNullOrWhiteSpace(e.ImageUrls)
                ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(e.ImageUrls)
                : [],
            e.Notes);
    }
}
