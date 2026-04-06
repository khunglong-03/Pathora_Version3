namespace Application.Features.HotelRoomInventory.Commands.CreateHotelRoomInventory;

using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Enums;
using FluentValidation;

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