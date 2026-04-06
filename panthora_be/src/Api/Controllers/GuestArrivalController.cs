namespace Api.Controllers;

using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.GuestArrival.Commands.CreateGuestArrival;
using Application.Features.GuestArrival.Commands.UpdateGuestArrival;
using Application.Features.GuestArrival.DTOs;
using Application.Features.GuestArrival.Queries.GetGuestArrival;
using Application.Features.GuestArrival.Queries.GetGuestArrivalsByHotel;
using BuildingBlocks.CORS;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.HotelServiceProvider}")]
public class GuestArrivalController : BaseApiController
{
    // ─── Get Arrivals ───────────────────────────────────────────────────────

    /// <summary>List all guest arrivals for a specific hotel (supplier).</summary>
    [HttpGet(GuestArrivalEndpoint.Base)]
    public async Task<IActionResult> GetByHotel([FromQuery] Guid supplierId)
    {
        var result = await Sender.Send(new GetGuestArrivalsByHotelQuery(supplierId));
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

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
            ?? User.FindFirst("sub");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}
