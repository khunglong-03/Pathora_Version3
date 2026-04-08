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

}
