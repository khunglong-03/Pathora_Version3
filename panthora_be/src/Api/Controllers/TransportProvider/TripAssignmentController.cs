namespace Api.Controllers.TransportProvider;

using Api.Endpoint.TransportProvider;
using Application.Features.TransportProvider.TripAssignments.Commands;
using Application.Features.TransportProvider.TripAssignments.DTOs;
using Application.Features.TransportProvider.TripAssignments.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "TransportProviderOnly")]
public class TripAssignmentController : BaseApiController
{
    [HttpGet(TripAssignmentEndpoint.Base)]
    public async Task<IActionResult> GetTripAssignments([FromQuery] int? status = null)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetTripAssignmentsQuery(userId, status));
        return HandleResult(result);
    }

    [HttpGet($"{TripAssignmentEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> GetTripAssignmentDetail(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetTripAssignmentDetailQuery(userId, id));
        return HandleResult(result);
    }

    [HttpPut($"{TripAssignmentEndpoint.Base}/{{id:guid}}/accept")]
    public async Task<IActionResult> AcceptTripAssignment(
        Guid id,
        [FromBody] AcceptTripAssignmentRequestDto? request = null)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new AcceptTripAssignmentCommand(userId, id, request ?? new AcceptTripAssignmentRequestDto()));
        return HandleResult(result);
    }

    [HttpPut($"{TripAssignmentEndpoint.Base}/{{id:guid}}/reject")]
    public async Task<IActionResult> RejectTripAssignment(
        Guid id,
        [FromBody] RejectTripAssignmentRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new RejectTripAssignmentCommand(userId, id, request));
        return HandleResult(result);
    }

    [HttpPatch($"{TripAssignmentEndpoint.Base}/{{id:guid}}/status")]
    public async Task<IActionResult> UpdateTripStatusPatch(
        Guid id,
        [FromBody] UpdateTripStatusRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new UpdateTripStatusCommand(userId, id, request));
        return HandleResult(result);
    }

    [HttpPut($"{TripAssignmentEndpoint.Base}/{{id:guid}}/status")]
    public async Task<IActionResult> UpdateTripStatusPut(
        Guid id,
        [FromBody] UpdateTripStatusRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new UpdateTripStatusCommand(userId, id, request));
        return HandleResult(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}
