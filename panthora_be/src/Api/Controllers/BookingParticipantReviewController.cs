using Api.Endpoint;
using Application.Features.BookingManagement.Participant;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "TourOperatorBookingTeam")]
[Route(BookingManagementEndpoint.Base)]
public sealed class BookingParticipantReviewController : BaseApiController
{
    [HttpPost(BookingManagementEndpoint.ParticipantInfoReview)]
    public async Task<IActionResult> ReviewParticipantInfo(
        Guid id,
        Guid participantId,
        [FromBody] ReviewParticipantInfoRequest request)
    {
        var command = new ReviewParticipantInfoCommand(id, participantId, request.IsApproved, request.RejectionReason);
        var result = await Sender.Send(command);
        return HandleUpdated(result);
    }

    [HttpPost(BookingManagementEndpoint.ParticipantInfoReviewBulk)]
    public async Task<IActionResult> BulkApproveParticipantInfo(
        Guid id,
        [FromBody] BulkApproveParticipantInfoRequest request)
    {
        var command = new BulkApproveParticipantInfoCommand(id, request.ParticipantIds);
        var result = await Sender.Send(command);
        return HandleUpdated(result);
    }
}

public sealed record ReviewParticipantInfoRequest(bool IsApproved, string? RejectionReason);
public sealed record BulkApproveParticipantInfoRequest(Guid[] ParticipantIds);
