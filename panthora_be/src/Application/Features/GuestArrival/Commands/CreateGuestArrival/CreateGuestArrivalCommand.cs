namespace Application.Features.GuestArrival.Commands.CreateGuestArrival;

using BuildingBlocks.CORS;
using ErrorOr;

public sealed record CreateGuestArrivalCommand(
    Guid BookingAccommodationDetailId,
    Guid SubmittedByUserId,
    List<Guid> ParticipantIds
) : ICommand<ErrorOr<Guid>>;
