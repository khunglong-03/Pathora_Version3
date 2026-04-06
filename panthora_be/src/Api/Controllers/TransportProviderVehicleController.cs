namespace Api.Controllers;

using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.TransportProvider.Vehicles.Commands;
using Application.Features.TransportProvider.Vehicles.Queries;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.TransportProvider}")]
public class TransportProviderVehicleController : BaseApiController
{
    [HttpGet(TransportProviderVehicleEndpoint.Base)]
    public async Task<IActionResult> GetVehicles([FromQuery] int? locationArea = null)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetVehiclesQuery(userId, locationArea.HasValue ? (Continent)locationArea.Value : null));
        return HandleResult(result);
    }

    [HttpGet($"{TransportProviderVehicleEndpoint.Base}/{{plate}}")]
    public async Task<IActionResult> GetVehicleByPlate(string plate)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetVehicleByPlateQuery(userId, plate));
        return HandleResult(result);
    }

    [HttpPost(TransportProviderVehicleEndpoint.Base)]
    public async Task<IActionResult> CreateVehicle([FromBody] Application.Features.TransportProvider.Vehicles.DTOs.CreateVehicleRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new CreateVehicleCommand(userId, request));
        return HandleResult(result);
    }

    [HttpPut($"{TransportProviderVehicleEndpoint.Base}/{{plate}}")]
    public async Task<IActionResult> UpdateVehicle(string plate, [FromBody] Application.Features.TransportProvider.Vehicles.DTOs.UpdateVehicleRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new UpdateVehicleCommand(userId, plate, request));
        return HandleResult(result);
    }

    [HttpDelete($"{TransportProviderVehicleEndpoint.Base}/{{plate}}")]
    public async Task<IActionResult> DeleteVehicle(string plate)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new DeleteVehicleCommand(userId, plate));
        return HandleResult(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}
