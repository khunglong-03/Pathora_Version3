using Api.Endpoint;
using Application.Features.Public.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Public;

[Route(PublicEndpoint.Base + "/" + PublicEndpoint.Bookings)]
public class PublicBookingController : BaseApiController
{
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreatePublicBookingCommand command)
    {
        var result = await Sender.Send(command);
        return HandleCreated(result);
    }
    [Authorize]
    [HttpGet("my-bookings")]
    public async Task<IActionResult> GetMyBookings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null)
    {
        var result = await Sender.Send(new Application.Features.BookingManagement.Queries.GetMyBookings.GetMyBookingsQuery(page, pageSize, status));
        return HandleResult(result);
    }
}
