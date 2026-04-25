using Api.Endpoint;

namespace Api.Controllers.TransportProvider;

using Api.Endpoint.TransportProvider;
using Application.Features.TransportProvider.Vehicles.Commands;
using Application.Features.TransportProvider.Vehicles.Queries;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "TransportProviderOnly")]
public class VehicleController : BaseApiController
{
    [HttpGet(VehicleEndpoint.Base)]
    public async Task<IActionResult> GetVehicles([FromQuery] int? locationArea = null, [FromQuery] bool? isActive = null, [FromQuery] bool? isDeleted = false, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetVehiclesQuery(userId, locationArea.HasValue ? (Continent)locationArea.Value : null, isActive, isDeleted, pageNumber, pageSize));
        return HandleResult(result);
    }

    [HttpGet($"{VehicleEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> GetVehicleById(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new GetVehicleByIdQuery(userId, id));
        return HandleResult(result);
    }

    [HttpPost(VehicleEndpoint.Base)]
    public async Task<IActionResult> CreateVehicle([FromBody] Application.Features.TransportProvider.Vehicles.DTOs.CreateVehicleRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new CreateVehicleCommand(userId, request));
        return HandleResult(result);
    }

    [HttpPut($"{VehicleEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> UpdateVehicle(Guid id, [FromBody] Application.Features.TransportProvider.Vehicles.DTOs.UpdateVehicleRequestDto request)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new UpdateVehicleCommand(userId, id, request));
        return HandleResult(result);
    }

    [HttpDelete($"{VehicleEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> DeleteVehicle(Guid id)
    {
        var userId = GetCurrentUserId();
        var result = await Sender.Send(new DeleteVehicleCommand(userId, id));
        return HandleResult(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}