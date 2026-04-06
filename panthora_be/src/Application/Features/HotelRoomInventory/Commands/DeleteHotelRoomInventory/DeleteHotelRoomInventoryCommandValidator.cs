namespace Application.Features.HotelRoomInventory.Commands.DeleteHotelRoomInventory;

using Application.Common.Constant;
using BuildingBlocks.CORS;
using FluentValidation;

public sealed class DeleteHotelRoomInventoryCommandValidator : AbstractValidator<DeleteHotelRoomInventoryCommand>
{
    public DeleteHotelRoomInventoryCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.CommonIdRequired);
    }
}