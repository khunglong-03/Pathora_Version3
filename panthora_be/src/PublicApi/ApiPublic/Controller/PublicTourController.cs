using ApiPublic.Controller.BaseController;
using ApiPublic.Endpoint;
using Application.Features.Public.Commands;
using Application.Features.Public.Queries;
using Contracts.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiPublic.Controller;

/// <summary>
/// Public tour endpoints — no authentication required.
/// The authenticated endpoint (RequestPrivateTour) stays in the main Api service.
/// </summary>
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

    [HttpGet("{id:guid}/similar")]
    public async Task<IActionResult> GetSimilarTours(Guid id, [FromServices] ILanguageContext languageContext)
    {
        var result = await Sender.Send(new GetSimilarToursQuery(id, languageContext.CurrentLanguage));
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

    [HttpPost("{id:guid}/request-private")]
    public async Task<IActionResult> RequestPrivateTour(Guid id, [FromBody] RequestPublicPrivateTourRequestDto request)
    {
        var result = await Sender.Send(new RequestPublicPrivateTourCommand(
            id,
            request.ClassificationId,
            request.StartDate,
            request.EndDate,
            request.MaxParticipation,
            request.CustomerName,
            request.CustomerPhone,
            request.CustomerEmail,
            request.NumberAdult,
            request.NumberChild,
            request.NumberInfant,
            request.PaymentMethod,
            request.IsFullPay,
            request.WantsCustomization,
            request.CustomizationNotes));
        return HandleResult(result);
    }
}
