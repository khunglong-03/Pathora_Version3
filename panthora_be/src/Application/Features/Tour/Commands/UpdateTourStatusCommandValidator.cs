using Application.Common.Constant;
using Domain.Enums;
using FluentValidation;

namespace Application.Features.Tour.Commands;

public sealed class UpdateTourStatusCommandValidator : AbstractValidator<UpdateTourStatusCommand>
{
    public UpdateTourStatusCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.CommonIdRequired);

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage(ValidationMessages.TourStatusInvalid);
    }
}
