using Application.Common.Constant;
using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;

namespace Application.Features.HotelRoomInventory.Commands.CreateHotelRoomInventory;

public sealed record CreateHotelRoomInventoryCommand(
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("totalRooms")] int TotalRooms) : ICommand<ErrorOr<HotelRoomInventoryDto>>;

public sealed class CreateHotelRoomInventoryCommandHandler(
    IHotelRoomInventoryRepository inventoryRepository,
    ISupplierRepository supplierRepository,
    IUser user,
    IUnitOfWork unitOfWork)
    : ICommandHandler<CreateHotelRoomInventoryCommand, ErrorOr<HotelRoomInventoryDto>>
{
    public async Task<ErrorOr<HotelRoomInventoryDto>> Handle(
        CreateHotelRoomInventoryCommand request,
        CancellationToken cancellationToken)
    {
        var performedBy = user.Id ?? "system";

        var supplier = await supplierRepository.GetByIdAsync(request.SupplierId);
        if (supplier is null)
        {
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);
        }

        if (supplier.SupplierType != SupplierType.Accommodation)
        {
            return Error.Validation("Supplier.NotAccommodation", "The selected supplier is not an accommodation provider.");
        }

        var existing = await inventoryRepository.FindByHotelAndRoomTypeAsync(request.SupplierId, request.RoomType);
        if (existing is not null)
        {
            return Error.Conflict("HotelRoomInventory.Duplicate", "An inventory entry for this supplier and room type already exists.");
        }

        var entity = HotelRoomInventoryEntity.Create(
            request.SupplierId,
            request.RoomType,
            request.TotalRooms,
            performedBy);

        await inventoryRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return new HotelRoomInventoryDto(
            entity.Id,
            entity.SupplierId,
            supplier.Name,
            entity.RoomType,
            entity.TotalRooms,
            entity.Name,
            entity.Address,
            entity.LocationArea?.ToString(),
            entity.OperatingCountries,
            entity.ImageUrls,
            entity.Notes);
    }
}

public sealed class CreateHotelRoomInventoryCommandValidator : AbstractValidator<CreateHotelRoomInventoryCommand>
{
    public CreateHotelRoomInventoryCommandValidator()
    {
        RuleFor(x => x.SupplierId)
            .NotEmpty().WithMessage(ValidationMessages.CommonIdRequired);

        RuleFor(x => x.RoomType)
            .IsInEnum().WithMessage("Room type is invalid.");

        RuleFor(x => x.TotalRooms)
            .GreaterThan(0).WithMessage("Total rooms must be greater than 0.");
    }
}