namespace Application.Features.GuestArrival.Commands.UpdateGuestArrival;

using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record UpdateGuestArrivalCommand(
    [property: JsonPropertyName("guestArrivalId")] Guid GuestArrivalId,
    [property: JsonPropertyName("checkedInByUserId")] Guid? CheckedInByUserId,
    [property: JsonPropertyName("checkedOutByUserId")] Guid? CheckedOutByUserId,
    [property: JsonPropertyName("markNoShow")] GuestStayStatus? MarkNoShow,
    [property: JsonPropertyName("submissionStatus")] GuestArrivalSubmissionStatus? SubmissionStatus,
    [property: JsonPropertyName("note")] string? Note) : ICommand<ErrorOr<Success>>;
