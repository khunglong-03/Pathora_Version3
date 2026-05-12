using ApiPublic.Controller.BaseController;
using ApiPublic.Endpoint;
using Application.Features.Public.Commands;
using Application.Features.Public.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiPublic.Controller;

/// <summary>
/// Public booking endpoints — no authentication required.
/// The authenticated endpoint (GetMyBookings) stays in the main Api service.
/// </summary>
[AllowAnonymous]
[Route(PublicEndpoint.Base + "/" + PublicEndpoint.Bookings)]
public class PublicBookingController : BaseApiController
{
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreatePublicBookingCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}/checkout-price")]
    public async Task<IActionResult> GetCheckoutPrice(Guid id)
    {
        var result = await Sender.Send(new GetPublicCheckoutPriceQuery(id));
        return HandleResult(result);
    }
}
