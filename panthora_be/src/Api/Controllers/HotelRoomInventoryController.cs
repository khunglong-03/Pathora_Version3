namespace Api.Controllers;

using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.HotelRoomInventory.Commands.CreateHotelRoomInventory;
using Application.Features.HotelRoomInventory.Commands.DeleteHotelRoomInventory;
using Application.Features.HotelRoomInventory.Commands.UpdateHotelRoomInventory;
using Application.Features.HotelRoomInventory.DTOs;
using Application.Features.HotelRoomInventory.Queries.GetHotelRoomInventory;
using Application.Features.RoomBlocking.DTOs;
using Application.Features.RoomBlocking.Queries.GetHotelRoomAvailability;
using BuildingBlocks.CORS;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.HotelServiceProvider}")]
public class HotelRoomInventoryController : BaseApiController
{
    // ─── Room Inventory CRUD ────────────────────────────────────────────────

    [HttpGet(HotelRoomInventoryEndpoint.Base)]
    public async Task<IActionResult> GetInventory([FromQuery] Guid supplierId)
    {
        var result = await Sender.Send(new GetHotelRoomInventoryQuery(supplierId));
        return HandleResult(result);
    }

    [HttpPost(HotelRoomInventoryEndpoint.Base)]
    public async Task<IActionResult> CreateInventory([FromBody] CreateHotelRoomInventoryRequestDto request)
    {
        var command = new CreateHotelRoomInventoryCommand(
            request.SupplierId,
            request.RoomType,
            request.TotalRooms);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpPut($"{HotelRoomInventoryEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> UpdateInventory(Guid id, [FromBody] UpdateHotelRoomInventoryRequestDto request)
    {
        var command = new UpdateHotelRoomInventoryCommand(id, request.TotalRooms);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpDelete($"{HotelRoomInventoryEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> DeleteInventory(Guid id)
    {
        var result = await Sender.Send(new DeleteHotelRoomInventoryCommand(id));
        return HandleResult(result);
    }

    // ─── Room Availability Query ───────────────────────────────────────────

    [HttpGet(HotelRoomAvailabilityEndpoint.Base)]
    public async Task<IActionResult> GetAvailability(
        [FromQuery] Guid supplierId,
        [FromQuery] DateOnly fromDate,
        [FromQuery] DateOnly toDate)
    {
        var result = await Sender.Send(new GetHotelRoomAvailabilityQuery(supplierId, fromDate, toDate));
        return HandleResult(result);
    }
}
