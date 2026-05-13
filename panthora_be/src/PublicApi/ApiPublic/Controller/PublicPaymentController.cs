using ApiPublic.Controller.BaseController;
using ApiPublic.Endpoint;
using Application.Common.Constant;
using Application.Contracts.Payment;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiPublic.Controller;

/// <summary>
/// Public payment endpoints — no authentication required.
/// CreateQr (requires auth) stays in the main Api service.
/// </summary>
[AllowAnonymous]
[Route(PaymentEndpoint.Base)]
public class PublicPaymentController : BaseApiController
{
    private readonly IRateLimitService _rateLimitService;

    public PublicPaymentController(IRateLimitService rateLimitService)
    {
        _rateLimitService = rateLimitService;
    }

    [HttpPost(PaymentEndpoint.CreatePrivateCustomInitial)]
    public async Task<IActionResult> CreatePrivateCustomInitial([FromBody] CreatePrivateTourInitialPaymentCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpPost(PaymentEndpoint.CreateTransaction)]
    public async Task<IActionResult> CreateTransaction([FromBody] CreatePaymentTransactionCommand command)
    {
        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [HttpGet(PaymentEndpoint.GetTransaction)]
    public async Task<IActionResult> GetTransaction([FromRoute] string code)
    {
        var result = await Sender.Send(new GetPaymentTransactionQuery(code));
        return HandleResult(result);
    }

    [HttpGet(PaymentEndpoint.CheckPayment)]
    public async Task<IActionResult> CheckPayment([FromRoute] string code)
    {
        var result = await Sender.Send(new CheckPaymentNowCommand(code));
        return HandleResult(result);
    }

    [HttpGet(PaymentEndpoint.GetTransactionStatus)]
    public async Task<IActionResult> GetTransactionStatus([FromRoute] string code)
    {
        var (allowed, retryAfter) = _rateLimitService.CheckRateLimit(code);
        if (!allowed)
        {
            Response.Headers["Retry-After"] = retryAfter.ToString();
            return StatusCode(429, new { error = "Too many requests", retryAfterSeconds = retryAfter });
        }

        var result = await Sender.Send(new GetNormalizedPaymentStatusQuery(code));
        return HandleResult(result);
    }

    [HttpGet(PaymentEndpoint.Return)]
    public async Task<IActionResult> ReconcileReturn(
        [FromQuery] string? transactionCode,
        [FromQuery] string? code,
        [FromQuery] string? orderCode)
    {
        var resolvedCode = ResolveTransactionCode(transactionCode, code, orderCode);
        if (string.IsNullOrWhiteSpace(resolvedCode))
        {
            return BadRequest(new { message = "Missing transaction code for payment return callback." });
        }

        var result = await Sender.Send(new ReconcilePaymentReturnCommand(resolvedCode));
        return HandleResult(result);
    }

    [HttpGet(PaymentEndpoint.Cancel)]
    public async Task<IActionResult> ReconcileCancel(
        [FromQuery] string? transactionCode,
        [FromQuery] string? code,
        [FromQuery] string? orderCode)
    {
        var resolvedCode = ResolveTransactionCode(transactionCode, code, orderCode);
        if (string.IsNullOrWhiteSpace(resolvedCode))
        {
            return BadRequest(new { message = "Missing transaction code for payment cancel callback." });
        }

        var result = await Sender.Send(new ReconcilePaymentCancelCommand(resolvedCode));
        return HandleResult(result);
    }

    [HttpPost(PaymentEndpoint.ExpireTransaction)]
    public async Task<IActionResult> ExpireTransaction([FromRoute] string code)
    {
        var result = await Sender.Send(new ExpirePaymentTransactionCommand(code));
        return HandleResult(result);
    }

    [HttpGet("pending-by-booking/{bookingId:guid}")]
    public async Task<IActionResult> GetPendingByBooking(Guid bookingId)
    {
        var result = await Sender.Send(new GetPendingTransactionByBookingIdQuery(bookingId));
        return HandleResult(result);
    }

    private static string ResolveTransactionCode(string? transactionCode, string? code, string? orderCode)
    {
        if (!string.IsNullOrWhiteSpace(transactionCode))
        {
            return transactionCode;
        }

        if (!string.IsNullOrWhiteSpace(code))
        {
            return code;
        }

        return orderCode ?? string.Empty;
    }
}
