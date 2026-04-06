namespace Application.Features.GuestArrival.Commands.UpdateGuestArrival;

using FluentValidation;

public sealed class UpdateGuestArrivalCommandValidator : AbstractValidator<UpdateGuestArrivalCommand>
{
    public UpdateGuestArrivalCommandValidator()
    {
        RuleFor(x => x.GuestArrivalId).NotEmpty();
        RuleFor(x => x.Note).MaximumLength(1000);
    }
}
