namespace Application.Features.HotelRoomInventory.Commands.UpdateHotelRoomInventory;

using Application.Common.Constant;
using BuildingBlocks.CORS;
using FluentValidation;

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