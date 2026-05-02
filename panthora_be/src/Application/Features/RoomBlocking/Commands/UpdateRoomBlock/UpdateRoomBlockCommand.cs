using Application.Common.Constant;
using Application.Features.RoomBlocking.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using IHotelRoomInventoryRepository = Domain.Common.Repositories.IHotelRoomInventoryRepository;
using IRoomBlockRepository = Domain.Common.Repositories.IRoomBlockRepository;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;

namespace Application.Features.RoomBlocking.Commands.UpdateRoomBlock;

public sealed record UpdateRoomBlockCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("roomCountBlocked")] int RoomCountBlocked) : ICommand<ErrorOr<RoomBlockDto>>;


public sealed class UpdateRoomBlockCommandHandler(
    IRoomBlockRepository roomBlockRepository,
    ISupplierRepository supplierRepository,
    IHotelRoomInventoryRepository inventoryRepository,
    IUser user,
    IUnitOfWork unitOfWork)
    : ICommandHandler<UpdateRoomBlockCommand, ErrorOr<RoomBlockDto>>
{
    public async Task<ErrorOr<RoomBlockDto>> Handle(
        UpdateRoomBlockCommand request,
        CancellationToken cancellationToken)
    {
        var performedBy = user.Id ?? "system";

        var entity = await roomBlockRepository.FindByIdAsync(request.Id);
        if (entity is null)
        {
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);
        }

        var inventory = await inventoryRepository.FindByHotelAndRoomTypeAsync(entity.SupplierId, entity.RoomType);
        if (inventory is not null)
        {
            var blockedCount = await roomBlockRepository.GetBlockedRoomCountAsync(
                entity.SupplierId, entity.RoomType, entity.BlockedDate, null, cancellationToken);

            var otherBlockedCount = blockedCount - entity.RoomCountBlocked;
            if (inventory.TotalRooms - otherBlockedCount < request.RoomCountBlocked)
            {
                return Error.Validation(
                    "RoomBlock.InsufficientInventory",
                    $"Insufficient rooms available. Only {inventory.TotalRooms - otherBlockedCount} rooms are available for {entity.RoomType} on {entity.BlockedDate}.");
            }
        }

        entity.UpdateRoomCount(request.RoomCountBlocked, performedBy);
        roomBlockRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        var supplier = await supplierRepository.GetByIdAsync(entity.SupplierId);

        return new RoomBlockDto(
            entity.Id,
            entity.SupplierId,
            supplier?.Name,
            entity.RoomType,
            entity.BookingAccommodationDetailId,
            entity.BookingId,
            entity.BlockedDate,
            entity.RoomCountBlocked,
            entity.CreatedOnUtc);
    }
}


public sealed class UpdateRoomBlockCommandValidator : AbstractValidator<UpdateRoomBlockCommand>
{
    public UpdateRoomBlockCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.CommonIdRequired);

        RuleFor(x => x.RoomCountBlocked)
            .GreaterThan(0).WithMessage("Room count must be greater than 0.");
    }
}
