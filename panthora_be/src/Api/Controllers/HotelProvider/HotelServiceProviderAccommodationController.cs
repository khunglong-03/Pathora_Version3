namespace Api.Controllers.HotelProvider;

using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.HotelServiceProvider.Accommodations.Commands;
using Application.Features.HotelServiceProvider.Accommodations.DTOs;
using Application.Features.HotelServiceProvider.Accommodations.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "HotelServiceProviderOnly")]
public class HotelServiceProviderAccommodationController : BaseApiController
{
    [HttpGet(HotelServiceProviderAccommodationEndpoint.Base)]
    public async Task<IActionResult> GetAccommodations()
    {
        var result = await Sender.Send(new GetAccommodationsQuery());
        return HandleResult(result);
    }

    [HttpGet($"{HotelServiceProviderAccommodationEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> GetAccommodationById(Guid id)
    {
        var result = await Sender.Send(new GetAccommodationByIdQuery(id));
        return HandleResult(result);
    }

    [HttpPost(HotelServiceProviderAccommodationEndpoint.Base)]
    public async Task<IActionResult> CreateAccommodation([FromBody] CreateAccommodationRequestDto request)
    {
        var result = await Sender.Send(new CreateAccommodationCommand(request));
        return HandleResult(result);
    }

    [HttpPut($"{HotelServiceProviderAccommodationEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> UpdateAccommodation(Guid id, [FromBody] UpdateAccommodationRequestDto request)
    {
        var result = await Sender.Send(new UpdateAccommodationCommand(id, request));
        return HandleResult(result);
    }

    [HttpDelete($"{HotelServiceProviderAccommodationEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> DeleteAccommodation(Guid id)
    {
        var result = await Sender.Send(new DeleteAccommodationCommand(id));
        return HandleResult(result);
    }
}
