using Api.Endpoint;
using Application.Common.Constant;
using Application.Dtos;
using Application.Features.TourInstance.Commands;
using Application.Features.TourInstance.Queries;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "ManagerOnly")]
[Authorize(Roles = RoleConstants.Admin_Manager_TourDesigner)]
[Route(TourInstanceEndpoint.Base)]
public class TourInstanceController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? searchText,
        [FromQuery] TourInstanceStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await Sender.Send(new GetAllTourInstancesQuery(searchText, status, pageNumber, pageSize));
        return HandleResult(result);
    }

    [HttpGet(TourInstanceEndpoint.Id)]
    public async Task<IActionResult> GetDetail(Guid id)
    {
        var result = await Sender.Send(new GetTourInstanceDetailQuery(id));
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTourInstanceCommand command)
    {
        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateTourInstanceCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpDelete(TourInstanceEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteTourInstanceCommand(id));
        return HandleResult(result);
    }

    [HttpGet(TourInstanceEndpoint.Stats)]
    public async Task<IActionResult> GetStats()
    {
        var result = await Sender.Send(new GetTourInstanceStatsQuery());
        return HandleResult(result);
    }

    [HttpPatch(TourInstanceEndpoint.ChangeStatus)]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeTourInstanceStatusRequest request)
    {
        var result = await Sender.Send(new ChangeTourInstanceStatusCommand(id, request.Status));
        return HandleResult(result);
    }

    [HttpGet(TourInstanceEndpoint.CheckDuplicate)]
    public async Task<IActionResult> CheckDuplicate(
        [FromQuery] Guid tourId,
        [FromQuery] Guid classificationId,
        [FromQuery] DateTimeOffset startDate)
    {
        var result = await Sender.Send(new CheckDuplicateTourInstanceQuery(tourId, classificationId, startDate));
        return HandleResult(result);
    }

    [HttpPut(TourInstanceEndpoint.DayId)]
    public async Task<IActionResult> UpdateDay(Guid id, Guid dayId, [FromBody] UpdateTourInstanceDayCommand command)
    {
        var updatedCommand = command with { InstanceId = id, DayId = dayId };
        var result = await Sender.Send(updatedCommand);
        return HandleResult(result);
    }

    [HttpPost(TourInstanceEndpoint.Days)]
    public async Task<IActionResult> CreateDay(Guid id, [FromBody] CreateTourInstanceDayCommand command)
    {
        var updatedCommand = command with { InstanceId = id };
        var result = await Sender.Send(updatedCommand);
        return HandleCreated(result);
    }

    [HttpPatch(TourInstanceEndpoint.ActivityId)]
    public async Task<IActionResult> UpdateActivity(Guid id, Guid dayId, Guid activityId, [FromBody] UpdateTourInstanceActivityCommand command)
    {
        var updatedCommand = command with { InstanceId = id, DayId = dayId, ActivityId = activityId };
        var result = await Sender.Send(updatedCommand);
        return HandleResult(result);
    }
}

public sealed record ChangeTourInstanceStatusRequest(TourInstanceStatus Status);
