namespace Api.Controllers;

using Api.Endpoint;
using Application.Features.AdminHotelBookings.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route(AdminBookingHotelEndpoint.Base)]
public class AdminHotelBookingController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetHotelBookings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] DateTimeOffset? fromDate = null,
        [FromQuery] DateTimeOffset? toDate = null,
        [FromQuery] string? searchText = null)
    {
        Domain.Enums.BookingStatus? bookingStatus = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<Domain.Enums.BookingStatus>(status, ignoreCase: true, out var parsed))
        {
            bookingStatus = parsed;
        }

        var query = new GetHotelBookingsForAdminQuery(page, pageSize, bookingStatus, fromDate, toDate, searchText);
        var result = await Sender.Send(query);
        return HandleResult(result);
    }
}