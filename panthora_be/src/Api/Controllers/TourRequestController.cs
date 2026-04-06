using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.TourRequest.Commands;
using Application.Features.TourRequest.Queries;
using Domain.Enums;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "ManagerOnly")]
[Authorize(Roles = RoleConstants.Admin_Manager_TourDesigner)]
[Route(TourRequestEndpoint.Base)]
public class TourRequestController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] TourRequestStatus? status = null,
        [FromQuery] DateTimeOffset? fromDate = null,
        [FromQuery] DateTimeOffset? toDate = null,
        [FromQuery] string? searchText = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await Sender.Send(new GetAllTourRequestsQuery(CurrentUserId, status, fromDate, toDate, searchText, pageNumber, pageSize));
        return HandleResult(result);
    }

    [HttpGet(TourRequestEndpoint.Id)]
    public async Task<IActionResult> GetDetail(Guid id)
    {
        var result = await Sender.Send(new GetTourRequestDetailQuery(id, CurrentUserId));
        return HandleResult(result);
    }

    [HttpPatch(TourRequestEndpoint.Review)]
    public async Task<IActionResult> Review(Guid id, [FromBody] ReviewTourRequestRequest request)
    {
        var result = await Sender.Send(new ReviewTourRequestCommand(id, request.Status, request.AdminNote));
        return HandleResult(result);
    }
}

public sealed record ReviewTourRequestRequest(
    [property: JsonConverter(typeof(JsonStringEnumConverter))] TourRequestStatus Status,
    string? AdminNote = null);
