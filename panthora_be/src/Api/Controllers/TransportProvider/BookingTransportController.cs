namespace Api.Controllers.TransportProvider;

using Application.Features.TourTransportAssignment.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "BookingTransportOnly")]
public class BookingTransportController : BaseApiController
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