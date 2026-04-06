using Api.Endpoint;
using Application.Features.Public.Queries;
using Contracts.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Public;

[AllowAnonymous]
[Route(PublicEndpoint.Base + "/" + PublicEndpoint.TourInstances)]
public class PublicTourInstanceController : BaseApiController
{
    [HttpGet(PublicEndpoint.Available)]
    public async Task<IActionResult> GetAvailable(
        [FromQuery] string? destination,
        [FromQuery] string? sortBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromServices] ILanguageContext? languageContext = null)
    {
        var result = await Sender.Send(new GetPublicTourInstancesQuery(destination, sortBy, page, pageSize, languageContext?.CurrentLanguage));
        return HandleResult(result);
    }

    [HttpGet(PublicEndpoint.Detail)]
    public async Task<IActionResult> GetDetail(Guid id, [FromServices] ILanguageContext? languageContext = null)
    {
        var result = await Sender.Send(new GetPublicTourInstanceDetailQuery(id, languageContext?.CurrentLanguage));
        return HandleResult(result);
    }
}
