namespace Api.Controllers;

using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.TourTransportAssignment.Commands;
using Application.Features.TourTransportAssignment.DTOs;
using Application.Features.TourTransportAssignment.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = $"{RoleConstants.Admin_TransportProvider},{RoleConstants.Admin_Manager_TourDesigner}")]
public class TourDayActivityRouteTransportController : BaseApiController
{
    [HttpPut(TourTransportAssignmentEndpoint.Assign)]
    public async Task<IActionResult> AssignRouteTransport([FromBody] RouteTransportAssignmentRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new AssignRouteTransportCommand(userId, request));
        return HandleResult(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}

[ApiController]
[Authorize]
public class BookingTransportInfoController : BaseApiController
{
    [HttpGet("booking/{bookingId:guid}/transport-info")]
    public async Task<IActionResult> GetBookingTransportInfo(Guid bookingId)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetBookingTransportInfoQuery(userId, bookingId));
        return HandleResult(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}
