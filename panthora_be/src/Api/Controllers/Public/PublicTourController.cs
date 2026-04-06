using Api.Endpoint;
using Application.Features.Public.Queries;
using Application.Features.Tour.Queries;
using Contracts.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Public;

[AllowAnonymous]
[Route(PublicEndpoint.Base + "/" + PublicEndpoint.Tours)]
public class PublicTourController : BaseApiController
{
    [HttpGet(PublicEndpoint.Detail)]
    public async Task<IActionResult> GetTourDetail(Guid id, [FromServices] ILanguageContext languageContext)
    {
        var result = await Sender.Send(new GetPublicTourDetailQuery(id, languageContext.CurrentLanguage));
        return HandleResult(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllTours(
        [FromQuery] string? searchText,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? lang = null,
        [FromServices] ILanguageContext? languageContext = null)
    {
        var language = lang ?? languageContext?.CurrentLanguage ?? "en";
        var result = await Sender.Send(new GetPublicToursQuery(searchText, pageNumber, pageSize, language));
        return HandleResult(result);
    }
}
