using Api.Endpoint;

namespace Api.Controllers.TransportProvider;

using Api.Endpoint.TransportProvider;
using Application.Features.TransportProvider.Drivers.Commands;
using Application.Features.TransportProvider.Drivers.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "TransportProviderOnly")]
public class DriverController : BaseApiController
{
    [HttpGet(DriverEndpoint.Base)]
    public async Task<IActionResult> GetDrivers([FromQuery] bool? isActive = null, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetDriversQuery(userId, isActive, pageNumber, pageSize));
        return HandleResult(result);
    }

    [HttpGet($"{DriverEndpoint.Base}/available")]
    public async Task<IActionResult> GetAvailableDrivers(
        [FromQuery] DateOnly date,
        [FromQuery] Guid? excludeActivityId = null)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetAvailableDriversQuery(userId, date, excludeActivityId));
        return HandleResult(result);
    }

    [HttpGet($"{DriverEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> GetDriverById(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetDriverByIdQuery(userId, id));
        return HandleResult(result);
    }

    [HttpPost(DriverEndpoint.Base)]
    public async Task<IActionResult> CreateDriver([FromBody] Application.Features.TransportProvider.Drivers.DTOs.CreateDriverRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new CreateDriverCommand(userId, request));
        return HandleResult(result);
    }

    [HttpPut($"{DriverEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> UpdateDriver(Guid id, [FromBody] Application.Features.TransportProvider.Drivers.DTOs.UpdateDriverRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new UpdateDriverCommand(userId, id, request));
        return HandleResult(result);
    }

    [HttpDelete($"{DriverEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> DeleteDriver(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new DeleteDriverCommand(userId, id));
        return HandleResult(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}