namespace Application.Features.RoomBlocking.Commands.DeleteRoomBlock;

using Application.Common.Constant;
using FluentValidation;

public sealed class DeleteRoomBlockCommandValidator : AbstractValidator<DeleteRoomBlockCommand>
{
    public DeleteRoomBlockCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.CommonIdRequired);
    }
}
