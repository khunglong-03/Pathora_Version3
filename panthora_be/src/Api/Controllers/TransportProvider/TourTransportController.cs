namespace Api.Controllers.TransportProvider;

using Api.Endpoint;
using Application.Features.TourTransportAssignment.Commands;
using Application.Features.TourTransportAssignment.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "TourAdminOnly")]
public class TourTransportController : BaseApiController
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