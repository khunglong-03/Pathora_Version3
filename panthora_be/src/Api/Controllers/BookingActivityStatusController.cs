using Api.Endpoint;
using Application.Common.Constant;
using Application.Contracts.Booking;
using Application.Features.BookingManagement.ActivityStatus;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "ManagerOrTourGuideOnly")]
[Route(BookingManagementEndpoint.Base)]
public sealed class BookingActivityStatusController : BaseApiController
{
    [HttpGet(BookingManagementEndpoint.ActivityStatuses)]
    public async Task<IActionResult> GetActivityStatuses(Guid id)
    {
        var result = await Sender.Send(new GetActivityStatusesQuery(id));
        return HandleResult(result);
    }

    [HttpGet(BookingManagementEndpoint.ActivityStatusDetail)]
    public async Task<IActionResult> GetActivityStatusDetail(Guid id, Guid tourDayId)
    {
        var result = await Sender.Send(new GetActivityStatusByTourDayQuery(id, tourDayId));
        return HandleResult(result);
    }

    [HttpPost(BookingManagementEndpoint.ActivityStatusStart)]
    public async Task<IActionResult> StartActivity(Guid id, Guid tourDayId, [FromBody] UpdateActivityStatusDto request)
    {
        var result = await Sender.Send(new StartActivityCommand(id, tourDayId, request.ActualTime));
        return HandleUpdated(result);
    }

    [HttpPost(BookingManagementEndpoint.ActivityStatusComplete)]
    public async Task<IActionResult> CompleteActivity(Guid id, Guid tourDayId, [FromBody] UpdateActivityStatusDto request)
    {
        var result = await Sender.Send(new CompleteActivityCommand(id, tourDayId, request.ActualTime));
        return HandleUpdated(result);
    }

    [HttpPost(BookingManagementEndpoint.ActivityStatusCancel)]
    public async Task<IActionResult> CancelActivity(Guid id, Guid tourDayId, [FromBody] UpdateActivityStatusDto request)
    {
        var reason = string.IsNullOrWhiteSpace(request.Reason)
            ? ErrorConstants.ActivityStatus.DefaultCancelReason.Resolve(CurrentLanguage)
            : request.Reason;
        var result = await Sender.Send(new CancelActivityCommand(id, tourDayId, reason));
        return HandleUpdated(result);
    }
}
