namespace Api.Controllers.HotelProvider;

using Api.Endpoint;
using Application.Features.RoomBlocking.Commands.CreateRoomBlock;
using Application.Features.RoomBlocking.Commands.DeleteRoomBlock;
using Application.Features.RoomBlocking.Commands.UpdateRoomBlock;
using Application.Features.RoomBlocking.DTOs;
using Application.Features.RoomBlocking.Queries.GetRoomBlocks;
using Domain.Common.Repositories;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "HotelServiceProviderOnly")]
public class RoomBlockController(ISupplierRepository supplierRepository) : BaseApiController
{
    [HttpGet(RoomBlockEndpoint.Base)]
    public async Task<IActionResult> GetBlocks(
        [FromQuery] Guid supplierId,
        [FromQuery] RoomType? roomType,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(userId);
        var supplier = suppliers.FirstOrDefault();
        if (supplier is null || supplier.SupplierType != SupplierType.Accommodation)
            return HandleResult<List<RoomBlockDto>>(new List<RoomBlockDto>());

        var effectiveSupplierId = supplierId == Guid.Empty ? supplier.Id : supplierId;
        if (effectiveSupplierId != supplier.Id)
            return StatusCode(403, "You can only view room blocks for your own hotel.");

        var query = new GetRoomBlocksQuery(effectiveSupplierId, roomType, fromDate, toDate);
        var result = await Sender.Send(query);
        return HandleResult(result);
    }

    [HttpPost(RoomBlockEndpoint.Base)]
    public async Task<IActionResult> Create([FromBody] CreateRoomBlockRequestDto? request)
    {
        if (request is null)
            return BadRequest("Request body is required.");

        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(userId);
        var supplier = suppliers.FirstOrDefault();
        if (supplier is null || supplier.SupplierType != SupplierType.Accommodation)
            return StatusCode(403, "You do not have an accommodation supplier.");

        if (request.SupplierId != supplier.Id)
            return StatusCode(403, "You can only create room blocks for your own hotel.");

        var command = new CreateRoomBlockCommand(
            request.SupplierId,
            request.RoomType,
            request.BookingAccommodationDetailId,
            request.BookingId,
            request.BlockedDate,
            request.RoomCountBlocked);

        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpPut($"{RoomBlockEndpoint.Base}/{RoomBlockEndpoint.Id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoomBlockRequestDto request)
    {
        var command = new UpdateRoomBlockCommand(id, request.RoomCountBlocked);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpDelete($"{RoomBlockEndpoint.Base}/{RoomBlockEndpoint.Id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteRoomBlockCommand(id));
        return HandleResult(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}
