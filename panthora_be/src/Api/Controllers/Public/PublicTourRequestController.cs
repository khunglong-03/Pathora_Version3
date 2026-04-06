using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.TourRequest.Commands;
using Application.Features.TourRequest.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Public;

[Authorize(Roles = RoleConstants.Admin_Customer)]
[Route(PublicEndpoint.Base + "/" + PublicEndpoint.TourRequests)]
public class PublicTourRequestController : BaseApiController
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTourRequestCommand command)
    {
        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [HttpGet(PublicEndpoint.My)]
    public async Task<IActionResult> GetMy(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await Sender.Send(new GetMyTourRequestsQuery(CurrentUserId, pageNumber, pageSize));
        return HandleResult(result);
    }

    [HttpGet(PublicEndpoint.Detail)]
    public async Task<IActionResult> GetDetail(Guid id)
    {
        var result = await Sender.Send(new GetTourRequestDetailQuery(id, CurrentUserId));
        return HandleResult(result);
    }
}
