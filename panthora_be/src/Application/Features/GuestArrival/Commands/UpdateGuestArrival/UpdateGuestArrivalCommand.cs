namespace Application.Features.GuestArrival.Commands.UpdateGuestArrival;

using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;

public sealed record UpdateGuestArrivalCommand(
    Guid GuestArrivalId,
    Guid? CheckedInByUserId,
    Guid? CheckedOutByUserId,
    GuestStayStatus? MarkNoShow,
    GuestArrivalSubmissionStatus? SubmissionStatus,
    string? Note
) : ICommand<ErrorOr<Success>>;
