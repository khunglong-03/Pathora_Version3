namespace Application.Features.HotelRoomInventory.Commands.UpdateHotelRoomInventory;

using Application.Common.Constant;
using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;



public sealed record UpdateHotelRoomInventoryCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("totalRooms")] int TotalRooms) : ICommand<ErrorOr<HotelRoomInventoryDto>>;

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

        entity.Update(
            request.TotalRooms,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
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
            entity.ImageUrls,
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