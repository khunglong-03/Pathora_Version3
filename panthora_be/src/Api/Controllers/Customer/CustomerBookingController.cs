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

    [HttpGet("{bookingId:guid}")]
    public async Task<IActionResult> GetById(Guid bookingId)
    {
        var result = await Sender.Send(new Application.Features.BookingManagement.Queries.GetBookingDetail.GetBookingDetailQuery(bookingId));
        return HandleResult(result);
    }

    [HttpGet("{bookingId:guid}/customer-checkout-price")]
    public async Task<IActionResult> GetCustomerCheckoutPrice(Guid bookingId)
    {
        var result = await Sender.Send(new Application.Features.BookingManagement.Queries.GetCheckoutPriceQuery(bookingId));
        return HandleResult(result);
    }

    [HttpGet("{bookingId:guid}/participants")]
    public async Task<IActionResult> GetParticipants(Guid bookingId)
    {
        var result = await Sender.Send(new Application.Features.BookingManagement.Participant.GetBookingParticipantsQuery(bookingId));
        return HandleResult(result);
    }

    [HttpPost("{bookingId:guid}/participants")]
    public async Task<IActionResult> CreateParticipant(Guid bookingId, [FromBody] Application.Features.BookingManagement.Participant.CreateParticipantCommand request)
    {
        // Ensure the bookingId in path matches the body
        var command = request with { BookingId = bookingId };
        var result = await Sender.Send(command);
        return HandleResult(result);
    }
}
