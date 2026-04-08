namespace Api.Controllers.Customer;

using Api.Endpoint;
using Application.Features.BookingManagement.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "CustomerOnly")]
[Route(PublicEndpoint.Base + "/" + PublicEndpoint.Bookings)]
public class CustomerBookingController : BaseApiController
{
    /// <summary>Get recent bookings for the authenticated customer.</summary>
    [HttpGet(PublicEndpoint.MyRecentBookings)]
    public async Task<IActionResult> GetMyRecentBookings([FromQuery] int count = 3)
    {
        var result = await Sender.Send(new GetRecentBookingsQuery(count));
        return HandleResult(result);
    }
}
