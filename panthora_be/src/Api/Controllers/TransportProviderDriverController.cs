namespace Api.Controllers;

using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.TransportProvider.Drivers.Commands;
using Application.Features.TransportProvider.Drivers.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.TransportProvider}")]
public class TransportProviderDriverController : BaseApiController
{
    [HttpGet(TransportProviderDriverEndpoint.Base)]
    public async Task<IActionResult> GetDrivers()
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetDriversQuery(userId));
        return HandleResult(result);
    }

    [HttpGet($"{TransportProviderDriverEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> GetDriverById(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetDriverByIdQuery(userId, id));
        return HandleResult(result);
    }

    [HttpPost(TransportProviderDriverEndpoint.Base)]
    public async Task<IActionResult> CreateDriver([FromBody] Application.Features.TransportProvider.Drivers.DTOs.CreateDriverRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new CreateDriverCommand(userId, request));
        return HandleResult(result);
    }

    [HttpPut($"{TransportProviderDriverEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> UpdateDriver(Guid id, [FromBody] Application.Features.TransportProvider.Drivers.DTOs.UpdateDriverRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new UpdateDriverCommand(userId, id, request));
        return HandleResult(result);
    }

    [HttpDelete($"{TransportProviderDriverEndpoint.Base}/{{id:guid}}")]
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
