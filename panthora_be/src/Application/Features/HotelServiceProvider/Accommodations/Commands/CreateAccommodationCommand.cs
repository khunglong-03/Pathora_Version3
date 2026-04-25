using Application.Common.Constant;
using Application.Features.HotelServiceProvider.Accommodations.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using global::Contracts.Interfaces;

namespace Application.Features.HotelServiceProvider.Accommodations.Commands;
public sealed record CreateAccommodationCommand(
    CreateAccommodationRequestDto Request
) : ICommand<ErrorOr<AccommodationDto>>;


public sealed class CreateAccommodationCommandHandler(
    IHotelRoomInventoryRepository inventoryRepository,
    ISupplierRepository supplierRepository,
    IUser user,
    IUnitOfWork unitOfWork)
    : ICommandHandler<CreateAccommodationCommand, ErrorOr<AccommodationDto>>
{
    public async Task<ErrorOr<AccommodationDto>> Handle(
        CreateAccommodationCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = user.Id;
        if (currentUserId is null)
            return Error.Unauthorized();

        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(Guid.Parse(currentUserId), cancellationToken);
        var supplier = suppliers.FirstOrDefault();
        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.AccommodationNotFoundCode, ErrorConstants.Supplier.AccommodationNotFoundDescription.En);

        var existing = await inventoryRepository.FindByHotelAndRoomTypeAsync(supplier.Id, request.Request.RoomType);
        if (existing is not null)
            return Error.Conflict(ErrorConstants.Accommodation.DuplicateCode, ErrorConstants.Accommodation.DuplicateDescription.En);

        var entity = HotelRoomInventoryEntity.Create(
            supplierId: supplier.Id,
            roomType: request.Request.RoomType,
            totalRooms: request.Request.TotalRooms,
            performedBy: currentUserId,
            name: request.Request.Name,
            address: request.Request.Address,
            locationArea: request.Request.LocationArea.HasValue ? (Continent)request.Request.LocationArea.Value : null,
            operatingCountries: request.Request.OperatingCountries,
            imageUrls: request.Request.ImageUrls is { Count: > 0 }
                ? System.Text.Json.JsonSerializer.Serialize(request.Request.ImageUrls)
                : null,
            notes: request.Request.Notes);

        await inventoryRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

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
