using Application.Common.Constant;
using Application.Features.RoomBlocking.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using IHotelRoomInventoryRepository = Domain.Common.Repositories.IHotelRoomInventoryRepository;
using IRoomBlockRepository = Domain.Common.Repositories.IRoomBlockRepository;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;

namespace Application.Features.RoomBlocking.Commands.CreateRoomBlock;

public sealed record CreateRoomBlockCommand(
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("bookingAccommodationDetailId")] Guid? BookingAccommodationDetailId,
    [property: JsonPropertyName("bookingId")] Guid? BookingId,
    [property: JsonPropertyName("blockedDate")] DateOnly BlockedDate,
    [property: JsonPropertyName("roomCountBlocked")] int RoomCountBlocked) : ICommand<ErrorOr<RoomBlockDto>>;


public sealed class CreateRoomBlockCommandHandler(
    IRoomBlockRepository roomBlockRepository,
    ISupplierRepository supplierRepository,
    IHotelRoomInventoryRepository inventoryRepository,
    IUser user,
    IUnitOfWork unitOfWork)
    : ICommandHandler<CreateRoomBlockCommand, ErrorOr<RoomBlockDto>>
{
    public async Task<ErrorOr<RoomBlockDto>> Handle(
        CreateRoomBlockCommand request,
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

        var inventory = await inventoryRepository.FindByHotelAndRoomTypeAsync(request.SupplierId, request.RoomType);
        if (inventory is not null)
        {
            var blockedCount = await roomBlockRepository.GetBlockedRoomCountAsync(
                request.SupplierId, request.RoomType, request.BlockedDate, null, cancellationToken);

            if (inventory.TotalRooms - blockedCount < request.RoomCountBlocked)
            {
                return Error.Validation(
                    "RoomBlock.InsufficientInventory",
                    $"Insufficient rooms available. Only {inventory.TotalRooms - blockedCount} rooms are available for {request.RoomType} on {request.BlockedDate}.");
            }
        }

        var entity = RoomBlockEntity.Create(
            request.SupplierId,
            request.RoomType,
            request.BlockedDate,
            request.RoomCountBlocked,
            performedBy,
            request.BookingAccommodationDetailId,
            request.BookingId);

        roomBlockRepository.Add(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return new RoomBlockDto(
            entity.Id,
            entity.SupplierId,
            supplier.Name,
            entity.RoomType,
            entity.BookingAccommodationDetailId,
            entity.BookingId,
            entity.BlockedDate,
            entity.RoomCountBlocked,
            entity.CreatedOnUtc);
    }
}


public sealed class CreateRoomBlockCommandValidator : AbstractValidator<CreateRoomBlockCommand>
{
    public CreateRoomBlockCommandValidator()
    {
        RuleFor(x => x.SupplierId)
            .NotEmpty().WithMessage(ValidationMessages.CommonIdRequired);

        RuleFor(x => x.RoomType)
            .IsInEnum().WithMessage("Room type is invalid.");

        RuleFor(x => x.BlockedDate)
            .NotEmpty().WithMessage("Blocked date is required.");

        RuleFor(x => x.RoomCountBlocked)
            .GreaterThan(0).WithMessage("Room count must be greater than 0.");
    }
}
