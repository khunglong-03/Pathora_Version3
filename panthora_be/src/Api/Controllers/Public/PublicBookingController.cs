using Api.Endpoint;
using Application.Features.BookingManagement.Queries;
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

    /// <summary>Get recent bookings for the authenticated user. Accessible by any logged-in user (Customer, Admin, etc.)</summary>
    [Authorize]
    [HttpGet(PublicEndpoint.MyRecentBookings)]
    public async Task<IActionResult> GetMyRecentBookings([FromQuery] int count = 3)
    {
        var result = await Sender.Send(new GetRecentBookingsQuery(count));
        return HandleResult(result);
    }
}
