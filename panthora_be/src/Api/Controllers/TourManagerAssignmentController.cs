using Api.Endpoint;
using Application.Common.Constant;
using Application.Contracts.TourManagerAssignment;
using Application.Features.TourManagerAssignment.Commands.AssignTourManagerTeam;
using Application.Features.TourManagerAssignment.Commands.BulkAssignTourManagerTeam;
using Application.Features.TourManagerAssignment.Commands.RemoveTourManagerAssignment;
using Application.Features.TourManagerAssignment.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route(TourManagerAssignmentEndpoint.Base)]
public sealed class TourManagerAssignmentController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? managerId)
    {
        var result = await Sender.Send(new GetTourManagerAssignmentsQuery(managerId));
        return HandleResult(result);
    }

    [HttpGet(TourManagerAssignmentEndpoint.GetById)]
    public async Task<IActionResult> GetById(Guid managerId)
    {
        var result = await Sender.Send(new GetTourManagerAssignmentByIdQuery(managerId));
        return HandleResult(result);
    }

    [HttpPost(TourManagerAssignmentEndpoint.Assign)]
    public async Task<IActionResult> Assign([FromBody] AssignTourManagerTeamRequest request)
    {
        var command = new AssignTourManagerTeamCommand(request.TourManagerUserId, request.Assignments);
        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [HttpPost(TourManagerAssignmentEndpoint.BulkAssign)]
    public async Task<IActionResult> BulkAssign([FromBody] BulkAssignRequest request)
    {
        var command = new BulkAssignTourManagerTeamCommand(request.ManagerId, request.Assignments);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpDelete(TourManagerAssignmentEndpoint.Remove)]
    public async Task<IActionResult> Remove(
        Guid managerId,
        [FromQuery] Guid? assignedUserId,
        [FromQuery] Guid? assignedTourId,
        [FromQuery] int assignedEntityType)
    {
        var command = new RemoveTourManagerAssignmentCommand(
            managerId, assignedUserId, assignedTourId, assignedEntityType);
        var result = await Sender.Send(command);
        if (result.IsError)
            return HandleResult(result);
        return NoContent();
    }
}