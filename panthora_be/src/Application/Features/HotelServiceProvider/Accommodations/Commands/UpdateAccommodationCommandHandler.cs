namespace Application.Features.HotelServiceProvider.Accommodations.Commands;

using Application.Common.Constant;
using Application.Features.HotelServiceProvider.Accommodations.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed class UpdateAccommodationCommandHandler(
    IHotelRoomInventoryRepository inventoryRepository,
    ISupplierRepository supplierRepository,
    IUser user,
    IUnitOfWork unitOfWork)
    : ICommandHandler<UpdateAccommodationCommand, ErrorOr<AccommodationDto>>
{
    public async Task<ErrorOr<AccommodationDto>> Handle(
        UpdateAccommodationCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = user.Id;
        if (currentUserId is null)
            return Error.Unauthorized();

        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(Guid.Parse(currentUserId), cancellationToken);
        var supplier = suppliers.FirstOrDefault();
        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "No accommodation supplier found for your account.");

        var entity = await inventoryRepository.FindByIdAsync(request.Id);
        if (entity is null || entity.SupplierId != supplier.Id)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "Accommodation not found.");

        entity.Update(
            totalRooms: request.Request.TotalRooms,
            roomType: request.Request.RoomType,
            name: request.Request.Name,
            address: request.Request.Address,
            locationArea: request.Request.LocationArea.HasValue ? (Continent)request.Request.LocationArea.Value : null,
            operatingCountries: request.Request.OperatingCountries,
            imageUrls: request.Request.ImageUrls is { Count: > 0 }
                ? System.Text.Json.JsonSerializer.Serialize(request.Request.ImageUrls)
                : null,
            notes: request.Request.Notes,
            performedBy: currentUserId);

        inventoryRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return MapToDto(entity);
    }

    private static AccommodationDto MapToDto(Domain.Entities.HotelRoomInventoryEntity e)
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
            e.ImageUrls,
            e.Notes);
    }
}
