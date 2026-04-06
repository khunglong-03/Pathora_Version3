namespace Application.Features.GuestArrival.Commands.CreateGuestArrival;

using FluentValidation;

public sealed class CreateGuestArrivalCommandValidator : AbstractValidator<CreateGuestArrivalCommand>
{
    public CreateGuestArrivalCommandValidator()
    {
        RuleFor(x => x.BookingAccommodationDetailId).NotEmpty();
        RuleFor(x => x.SubmittedByUserId).NotEmpty();
        RuleFor(x => x.ParticipantIds).NotEmpty().WithMessage("At least one participant must be provided.");
    }
}
