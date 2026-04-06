using Application.Common.Constant;
using FluentValidation;

namespace Application.Features.Tour.Commands.PurgeTour;

public sealed class PurgeTourCommandValidator : AbstractValidator<PurgeTourCommand>
{
    public PurgeTourCommandValidator()
    {
        RuleFor(x => x.TourId)
            .NotEmpty().WithMessage(ValidationMessages.TourIdRequired);
    }
}
