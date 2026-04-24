namespace Application.Features.GuestArrival.Commands.CreateGuestArrival;

using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record CreateGuestArrivalCommand(
    [property: JsonPropertyName("bookingAccommodationDetailId")] Guid BookingAccommodationDetailId,
    [property: JsonPropertyName("submittedByUserId")] Guid SubmittedByUserId,
    [property: JsonPropertyName("participantIds")] List<Guid> ParticipantIds) : ICommand<ErrorOr<Guid>>;
