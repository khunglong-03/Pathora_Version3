namespace Application.Features.RoomBlocking.Commands.CreateRoomBlock;

using Application.Common.Constant;
using FluentValidation;

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
