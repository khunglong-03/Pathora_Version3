using Api.Endpoint;
using Application.Features.BookingManagement.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Roles = "Admin,Manager,TourOperator,TourGuide")]
[Route(BookingManagementEndpoint.Base)]
public class BookingInfoController : BaseApiController
{
    [HttpGet("by-tour-instance/{tourInstanceId:guid}")]
    public async Task<IActionResult> GetByTourInstance(Guid tourInstanceId)
    {
        var result = await Sender.Send(new GetBookingsByTourInstanceQuery(tourInstanceId));
        return HandleResult(result);
    }
}
