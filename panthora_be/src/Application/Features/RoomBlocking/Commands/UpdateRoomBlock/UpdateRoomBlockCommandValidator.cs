namespace Application.Features.RoomBlocking.Commands.UpdateRoomBlock;

using Application.Common.Constant;
using FluentValidation;

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
