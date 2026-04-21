using Api.Endpoint;
using Application.Common.Constant;
using Application.Dtos;
using Application.Features.TourInstance.Commands;
using Application.Features.TourInstance.Queries;
using Contracts;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route(TourInstanceEndpoint.Base)]
public class TourInstanceController : BaseApiController
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? searchText,
        [FromQuery] TourInstanceStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] bool excludePast = false)
    {
        var result = await Sender.Send(new GetAllTourInstancesQuery(searchText, status, pageNumber, pageSize, excludePast));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpGet(TourInstanceEndpoint.Id)]
    public async Task<IActionResult> GetDetail(Guid id)
    {
        var result = await Sender.Send(new GetTourInstanceDetailQuery(id));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTourInstanceCommand command)
    {
        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [AllowAnonymous]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateTourInstanceCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpDelete(TourInstanceEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteTourInstanceCommand(id));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpGet(TourInstanceEndpoint.Stats)]
    public async Task<IActionResult> GetStats()
    {
        var result = await Sender.Send(new GetTourInstanceStatsQuery());
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPatch(TourInstanceEndpoint.ChangeStatus)]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeTourInstanceStatusRequest request)
    {
        var result = await Sender.Send(new ChangeTourInstanceStatusCommand(id, request.Status));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpGet(TourInstanceEndpoint.CheckDuplicate)]
    public async Task<IActionResult> CheckDuplicate(
        [FromQuery] Guid tourId,
        [FromQuery] Guid classificationId,
        [FromQuery] DateTimeOffset startDate)
    {
        var result = await Sender.Send(new CheckDuplicateTourInstanceQuery(tourId, classificationId, startDate));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpGet(TourInstanceEndpoint.CheckGuideAvailability)]
    public async Task<IActionResult> CheckGuideAvailability(
        [FromQuery] List<Guid> guideUserIds,
        [FromQuery] DateTimeOffset startDate,
        [FromQuery] DateTimeOffset endDate)
    {
        var result = await Sender.Send(new CheckGuideAvailabilityQuery(guideUserIds, startDate, endDate));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPut(TourInstanceEndpoint.DayId)]
    public async Task<IActionResult> UpdateDay(Guid id, Guid dayId, [FromBody] UpdateTourInstanceDayCommand command)
    {
        var updatedCommand = command with { InstanceId = id, DayId = dayId };
        var result = await Sender.Send(updatedCommand);
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPost(TourInstanceEndpoint.Days)]
    public async Task<IActionResult> CreateDay(Guid id, [FromBody] CreateTourInstanceDayCommand command)
    {
        var updatedCommand = command with { InstanceId = id };
        var result = await Sender.Send(updatedCommand);
        return HandleCreated(result);
    }

    [AllowAnonymous]
    [HttpPatch(TourInstanceEndpoint.ActivityId)]
    public async Task<IActionResult> UpdateActivity(Guid id, Guid dayId, Guid activityId, [FromBody] UpdateTourInstanceActivityCommand command)
    {
        var updatedCommand = command with { InstanceId = id, DayId = dayId, ActivityId = activityId };
        var result = await Sender.Send(updatedCommand);
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpGet(TourInstanceEndpoint.ProviderAssigned)]
    public async Task<IActionResult> GetProviderAssigned(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] ProviderApprovalStatus? approvalStatus = null)
    {
        var result = await Sender.Send(new GetProviderAssignedTourInstancesQuery(pageNumber, pageSize, approvalStatus));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPost(TourInstanceEndpoint.HotelApprove)]
    public async Task<IActionResult> HotelApprove(Guid id, [FromBody] ProviderApproveRequest request)
    {
        var result = await Sender.Send(new ProviderApproveTourInstanceCommand(id, request.IsApproved, request.Note, "Hotel"));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPost(TourInstanceEndpoint.TransportApprove)]
    public async Task<IActionResult> TransportApprove(Guid id, [FromBody] ProviderApproveRequest request)
    {
        var result = await Sender.Send(new ProviderApproveTourInstanceCommand(id, request.IsApproved, request.Note, "Transport"));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPut("{instanceId:guid}/accommodations/{activityId:guid}/assign-rooms")]
    public async Task<IActionResult> AssignRoomToAccommodation(Guid instanceId, Guid activityId, [FromBody] AssignRoomRequest request)
    {
        var result = await Sender.Send(new AssignRoomToAccommodationCommand(instanceId, activityId, request.RoomType, request.RoomCount));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPut("{instanceId:guid}/activities/{activityId:guid}/assign")]
    public async Task<IActionResult> AssignVehicleToActivity(Guid instanceId, Guid activityId, [FromBody] AssignVehicleToRouteRequest request)
    {
        var result = await Sender.Send(new AssignVehicleToRouteCommand(instanceId, activityId, request.VehicleId, request.DriverId));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpGet("my-assignments")]
    public async Task<IActionResult> GetMyAssignments([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var result = await Sender.Send(new Application.Features.TourInstance.Queries.GetMyAssignedTourInstancesQuery(pageNumber, pageSize));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpGet("my-assignments/{id:guid}")]
    public async Task<IActionResult> GetMyAssignmentDetail(Guid id)
    {
        var result = await Sender.Send(new Application.Features.TourInstance.Queries.GetMyAssignedTourInstanceDetailQuery(id));
        return HandleResult(result);
    }

}

public sealed record ProviderApproveRequest(bool IsApproved, string? Note);

public sealed record AssignVehicleToRouteRequest(Guid VehicleId, Guid DriverId);

public sealed record AssignRoomRequest(string RoomType, int RoomCount);

public sealed record ChangeTourInstanceStatusRequest(TourInstanceStatus Status);
