using Api.Endpoint;
using Application.Features.Public.Commands;
using Application.Features.Public.Queries;
using Application.Features.Tour.Queries;
using Contracts.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Public;

[Route(PublicEndpoint.Base + "/" + PublicEndpoint.Tours)]
public class PublicTourController : BaseApiController
{
    [AllowAnonymous]
    [HttpGet(PublicEndpoint.Detail)]
    public async Task<IActionResult> GetTourDetail(Guid id, [FromServices] ILanguageContext languageContext)
    {
        var result = await Sender.Send(new GetPublicTourDetailQuery(id, languageContext.CurrentLanguage));
        return HandleResult(result);
    }

    [Authorize]
    [HttpPost("{id:guid}/request-private")]
    public async Task<IActionResult> RequestPrivateTour(Guid id, [FromBody] RequestPublicPrivateTourRequestDto body)
    {
        var command = new RequestPublicPrivateTourCommand(
            id,
            body.ClassificationId,
            body.StartDate,
            body.EndDate,
            body.MaxParticipation,
            body.CustomerName,
            body.CustomerPhone,
            body.CustomerEmail,
            body.NumberAdult,
            body.NumberChild,
            body.NumberInfant,
            body.PaymentMethod,
            body.IsFullPay,
            body.WantsCustomization,
            body.CustomizationNotes);
        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [AllowAnonymous]
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
