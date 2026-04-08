namespace Api.Controllers.HotelProvider;

using Api.Endpoint;
using Application.Features.GuestArrival.Commands.CreateGuestArrival;
using Application.Features.GuestArrival.Commands.UpdateGuestArrival;
using Application.Features.GuestArrival.DTOs;
using Application.Features.GuestArrival.Queries.GetGuestArrival;
using Application.Features.GuestArrival.Queries.GetGuestArrivalsByHotel;
using Domain.Common.Repositories;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Policy = "HotelServiceProviderOnly")]
public class GuestArrivalController : BaseApiController
{
    private readonly ISupplierRepository _supplierRepository;

    public GuestArrivalController(ISupplierRepository supplierRepository)
    {
        _supplierRepository = supplierRepository;
    }

    // ─── Get Arrivals ───────────────────────────────────────────────────────

    /// <summary>List all guest arrivals for the current user's hotel (supplier).</summary>
    [HttpGet(GuestArrivalEndpoint.Base)]
    public async Task<IActionResult> GetByHotel(
        [FromQuery] GuestStayStatus? status,
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo)
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
            return Unauthorized();

        var supplier = await _supplierRepository.FindByOwnerUserIdAsync(userId);
        if (supplier is null || supplier.SupplierType != SupplierType.Accommodation)
            return HandleResult<List<GuestArrivalListDto>>(new List<GuestArrivalListDto>());

        var result = await Sender.Send(new GetGuestArrivalsByHotelQuery(
            supplier.Id, status, dateFrom, dateTo));
        return HandleResult(result);
    }

    /// <summary>Get single arrival record by accommodation detail ID.</summary>
    [HttpGet($"{GuestArrivalEndpoint.Base}/accommodation/{{accommodationDetailId:guid}}")]
    public async Task<IActionResult> GetByAccommodationDetail(Guid accommodationDetailId)
    {
        var result = await Sender.Send(new GetGuestArrivalQuery(accommodationDetailId));
        return HandleResult(result);
    }

    // ─── Create / Submit Arrival ────────────────────────────────────────────

    [HttpPost(GuestArrivalEndpoint.Base)]
    public async Task<IActionResult> Create([FromBody] CreateGuestArrivalRequestDto request)
    {
        var submittedBy = GetCurrentUserId();
        var command = new CreateGuestArrivalCommand(
            request.BookingAccommodationDetailId,
            submittedBy,
            request.ParticipantIds);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    // ─── Update Arrival (CheckIn / CheckOut / NoShow / SubmissionStatus / Note) ──

    [HttpPut($"{GuestArrivalEndpoint.Base}/{{id:guid}}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGuestArrivalRequestDto request)
    {
        var command = new UpdateGuestArrivalCommand(
            GuestArrivalId: id,
            CheckedInByUserId: request.CheckedInByUserId,
            CheckedOutByUserId: request.CheckedOutByUserId,
            MarkNoShow: request.Status == Domain.Enums.GuestStayStatus.NoShow ? Domain.Enums.GuestStayStatus.NoShow : null,
            SubmissionStatus: request.SubmissionStatus,
            Note: request.Note);
        var result = await Sender.Send(command);
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
