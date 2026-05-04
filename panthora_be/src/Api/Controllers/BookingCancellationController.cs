using Api.Endpoint;
using Application.Features.BookingCancellation.Commands;
using Application.Features.BookingCancellation.Queries;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;

namespace Api.Controllers;

[Route(BookingCancellationEndpoint.Base)]
[Authorize]
public class BookingCancellationController : BaseApiController
{
    // ─── Customer ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Get the estimated cancellation fee for a booking.
    /// </summary>
    [HttpGet(BookingCancellationEndpoint.Estimate)]
    public async Task<IActionResult> GetFeeEstimate(Guid bookingId)
    {
        var result = await Sender.Send(new GetCancellationFeeEstimateQuery(bookingId));
        return HandleResult(result);
    }

    /// <summary>
    /// Submit a cancellation request for a booking.
    /// </summary>
    [HttpPost(BookingCancellationEndpoint.Request)]
    public async Task<IActionResult> RequestCancellation([FromBody] RequestCancellationBody body)
    {
        var result = await Sender.Send(new RequestBookingCancellationCommand(body.BookingId, body.Reason));
        return HandleResult(result);
    }

    /// <summary>
    /// Get the current customer's cancellation request history.
    /// </summary>
    [HttpGet(BookingCancellationEndpoint.MyRequests)]
    public async Task<IActionResult> GetMyRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] BookingCancellationRequestStatus? status = null)
    {
        var result = await Sender.Send(new GetMyCancellationRequestsQuery(page, pageSize, status));
        return HandleResult(result);
    }

    // ─── Manager ────────────────────────────────────────────────────────────────

    /// <summary>
    /// Manager: list all cancellation requests with filter and search.
    /// </summary>
    [Authorize(Policy = "ManagerOnly")]
    [HttpGet(BookingCancellationEndpoint.ManagerList)]
    public async Task<IActionResult> GetManagerList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] BookingCancellationRequestStatus? status = null,
        [FromQuery] string? search = null)
    {
        var result = await Sender.Send(new GetPendingCancellationRequestsQuery(page, pageSize, status, search));
        return HandleResult(result);
    }

    /// <summary>
    /// Manager: approve a cancellation request.
    /// </summary>
    [Authorize(Policy = "ManagerOnly")]
    [HttpPost(BookingCancellationEndpoint.Approve)]
    public async Task<IActionResult> Approve(Guid requestId, [FromBody] ManagerNoteBody? body)
    {
        if (!Guid.TryParse(CurrentUserId, out var managerId))
            return Unauthorized();

        var result = await Sender.Send(new ApproveCancellationRequestCommand(requestId, body?.ManagerNote, managerId));
        return HandleResult(result);
    }

    /// <summary>
    /// Manager: reject a cancellation request.
    /// </summary>
    [Authorize(Policy = "ManagerOnly")]
    [HttpPost(BookingCancellationEndpoint.Reject)]
    public async Task<IActionResult> Reject(Guid requestId, [FromBody] RejectBody body)
    {
        if (!Guid.TryParse(CurrentUserId, out var managerId))
            return Unauthorized();

        var result = await Sender.Send(new RejectCancellationRequestCommand(requestId, body.ManagerNote, managerId));
        return HandleResult(result);
    }

    /// <summary>
    /// Manager: confirm that refund has been issued to the customer.
    /// </summary>
    [Authorize(Policy = "ManagerOnly")]
    [HttpPost(BookingCancellationEndpoint.ConfirmRefund)]
    public async Task<IActionResult> ConfirmRefund(Guid requestId, [FromBody] ConfirmRefundBody? body)
    {
        if (!Guid.TryParse(CurrentUserId, out var managerId))
            return Unauthorized();

        var result = await Sender.Send(new ConfirmRefundCommand(requestId, body?.RefundNote, managerId));
        return HandleResult(result);
    }
}

// ─── Request body DTOs ─────────────────────────────────────────────────────────

public sealed record RequestCancellationBody(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("reason")] string Reason);

public sealed record ManagerNoteBody(
    [property: JsonPropertyName("managerNote")] string? ManagerNote);

public sealed record RejectBody(
    [property: JsonPropertyName("managerNote")] string ManagerNote);

public sealed record ConfirmRefundBody(
    [property: JsonPropertyName("refundNote")] string? RefundNote);
