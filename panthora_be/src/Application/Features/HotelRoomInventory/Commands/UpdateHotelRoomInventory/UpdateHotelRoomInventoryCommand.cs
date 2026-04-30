using Application.Common.Constant;
using Application.Dtos;
using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;

namespace Application.Features.HotelRoomInventory.Commands.UpdateHotelRoomInventory;

public sealed record UpdateHotelRoomInventoryCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("totalRooms")] int TotalRooms,
    [property: JsonPropertyName("thumbnail")] ImageDto? Thumbnail = null,
    [property: JsonPropertyName("images")] List<ImageDto>? Images = null) : ICommand<ErrorOr<HotelRoomInventoryDto>>;

public sealed class UpdateHotelRoomInventoryCommandHandler(
    IHotelRoomInventoryRepository inventoryRepository,
    ISupplierRepository supplierRepository,
    IUser user,
    IUnitOfWork unitOfWork)
    : ICommandHandler<UpdateHotelRoomInventoryCommand, ErrorOr<HotelRoomInventoryDto>>
{
    public async Task<ErrorOr<HotelRoomInventoryDto>> Handle(
        UpdateHotelRoomInventoryCommand request,
        CancellationToken cancellationToken)
    {
        var performedBy = user.Id ?? "system";

        var entity = await inventoryRepository.FindByIdAsync(request.Id);
        if (entity is null)
        {
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);
        }

        var supplier = await supplierRepository.GetByIdAsync(entity.SupplierId);

        var thumbnail = request.Thumbnail is not null ? new ImageEntity { FileId = request.Thumbnail.FileId, OriginalFileName = request.Thumbnail.OriginalFileName, FileName = request.Thumbnail.FileName, PublicURL = request.Thumbnail.PublicURL } : null;
        var images = request.Images?.Select(img => new ImageEntity { FileId = img.FileId, OriginalFileName = img.OriginalFileName, FileName = img.FileName, PublicURL = img.PublicURL }).ToList();

        entity.Update(
            request.TotalRooms,
            null, // roomType
            null, // name
            null, // address
            null, // locationArea
            null, // operatingCountries
            thumbnail,
            images,
            null, // notes
            performedBy);
        inventoryRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

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
            entity.Thumbnail is not null ? new ImageDto(entity.Thumbnail.FileId, entity.Thumbnail.OriginalFileName, entity.Thumbnail.FileName, entity.Thumbnail.PublicURL) : null,
            entity.Images?.Select(i => new ImageDto(i.FileId, i.OriginalFileName, i.FileName, i.PublicURL)).ToList(),
            entity.Notes);
    }
}

public sealed class UpdateHotelRoomInventoryCommandValidator : AbstractValidator<UpdateHotelRoomInventoryCommand>
{
    public UpdateHotelRoomInventoryCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.CommonIdRequired);

        RuleFor(x => x.TotalRooms)
            .GreaterThan(0).WithMessage("Total rooms must be greater than 0.");
    }
}