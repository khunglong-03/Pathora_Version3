using Application.Common.Constant;
using Application.Dtos;
using Application.Features.HotelServiceProvider.Accommodations.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using global::Contracts.Interfaces;

namespace Application.Features.HotelServiceProvider.Accommodations.Commands;

public sealed record UpdateAccommodationCommand(
    Guid Id,
    UpdateAccommodationRequestDto Request
) : ICommand<ErrorOr<AccommodationDto>>;


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
            return Error.NotFound(ErrorConstants.Supplier.AccommodationNotFoundCode, ErrorConstants.Supplier.AccommodationNotFoundDescription.En);

        var entity = await inventoryRepository.FindByIdAsync(request.Id);
        if (entity is null || entity.SupplierId != supplier.Id)
            return Error.NotFound(ErrorConstants.Accommodation.NotFoundCode, ErrorConstants.Accommodation.NotFoundDescription.En);

        var thumbnail = request.Request.Thumbnail is not null ? new ImageEntity { FileId = request.Request.Thumbnail.FileId, OriginalFileName = request.Request.Thumbnail.OriginalFileName, FileName = request.Request.Thumbnail.FileName, PublicURL = request.Request.Thumbnail.PublicURL } : null;
        var images = request.Request.Images?.Select(img => new ImageEntity { FileId = img.FileId, OriginalFileName = img.OriginalFileName, FileName = img.FileName, PublicURL = img.PublicURL }).ToList();

        entity.Update(
            totalRooms: request.Request.TotalRooms,
            roomType: request.Request.RoomType,
            name: request.Request.Name,
            address: request.Request.Address,
            locationArea: request.Request.LocationArea.HasValue ? (Continent)request.Request.LocationArea.Value : null,
            operatingCountries: request.Request.OperatingCountries,
            thumbnail: thumbnail,
            images: images,
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
            e.Thumbnail is not null ? new ImageDto(e.Thumbnail.FileId, e.Thumbnail.OriginalFileName, e.Thumbnail.FileName, e.Thumbnail.PublicURL) : null,
            e.Images?.Select(i => new ImageDto(i.FileId, i.OriginalFileName, i.FileName, i.PublicURL)).ToList(),
            e.Notes);
    }
}
