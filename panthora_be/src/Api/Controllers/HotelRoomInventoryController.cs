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
using Domain.Common.Repositories;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.HotelServiceProvider}")]
public class HotelRoomInventoryController : BaseApiController
{
    private readonly ISupplierRepository _supplierRepository;

    public HotelRoomInventoryController(ISupplierRepository supplierRepository)
    {
        _supplierRepository = supplierRepository;
    }

    // ─── Room Inventory CRUD ────────────────────────────────────────────────

    [HttpGet(HotelRoomInventoryEndpoint.Base)]
    public async Task<IActionResult> GetInventory()
    {
        var supplierIdResult = ResolveSupplierId();
        if (supplierIdResult is not null) return supplierIdResult;

        var result = await Sender.Send(new GetHotelRoomInventoryQuery(_resolvedSupplierId!.Value));
        return HandleResult(result);
    }

    [HttpPost(HotelRoomInventoryEndpoint.Base)]
    public async Task<IActionResult> CreateInventory([FromBody] CreateHotelRoomInventoryRequestDto? request)
    {
        if (request is null)
            return BadRequest("Request body is required.");

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
        [FromQuery] DateOnly fromDate,
        [FromQuery] DateOnly toDate)
    {
        var supplierIdResult = ResolveSupplierId();
        if (supplierIdResult is not null) return supplierIdResult;

        var result = await Sender.Send(new GetHotelRoomAvailabilityQuery(
            _resolvedSupplierId!.Value, fromDate, toDate));
        return HandleResult(result);
    }

    // ─── Ownership Scoping ───────────────────────────────────────────────────

    private Guid? _resolvedSupplierId;

    private IActionResult? ResolveSupplierId()
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var supplier = _supplierRepository.FindByOwnerUserIdAsync(userId).GetAwaiter().GetResult();
        if (supplier is null || supplier.SupplierType != SupplierType.Accommodation)
            return StatusCode(403, "You do not have an accommodation supplier.");

        _resolvedSupplierId = supplier.Id;
        return null;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}
