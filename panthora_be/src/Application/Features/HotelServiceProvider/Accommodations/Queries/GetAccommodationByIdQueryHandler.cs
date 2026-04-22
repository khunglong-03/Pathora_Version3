namespace Application.Features.HotelServiceProvider.Accommodations.Queries;

using Application.Common.Constant;
using Application.Features.HotelServiceProvider.Accommodations.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed class GetAccommodationByIdQueryHandler(
    IHotelRoomInventoryRepository inventoryRepository,
    ISupplierRepository supplierRepository,
    IUser user)
    : IQueryHandler<GetAccommodationByIdQuery, ErrorOr<AccommodationDto>>
{
    public async Task<ErrorOr<AccommodationDto>> Handle(
        GetAccommodationByIdQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = user.Id;
        if (currentUserId is null)
            return Error.Unauthorized();

        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(Guid.Parse(currentUserId), cancellationToken);
        var supplier = suppliers.FirstOrDefault();
        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);

        var entity = await inventoryRepository.FindByIdAsync(request.Id);
        if (entity is null || entity.SupplierId != supplier.Id)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "Accommodation not found.");

        return MapToDto(entity);
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
