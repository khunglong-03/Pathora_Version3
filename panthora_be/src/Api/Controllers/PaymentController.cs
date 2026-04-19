using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Api.Endpoint;
using Application.Common.Constant;
using Application.Contracts.Payment;
using Application.Services;

namespace Api.Controllers;

[Authorize]
[Route(PaymentEndpoint.Base)]
public class PaymentController : BaseApiController
{
    private readonly IRateLimitService _rateLimitService;

    public PaymentController(IRateLimitService rateLimitService)
    {
        _rateLimitService = rateLimitService;
    }

    [HttpPost(PaymentEndpoint.GetQR)]
    public async Task<IActionResult> CreateQr([FromBody] GetQRCommand command)
    {
        var result = await Sender.Send(command);
        return HandleCreated(result);
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

    [AllowAnonymous]
    [HttpGet(PaymentEndpoint.CheckPayment)]
    public async Task<IActionResult> CheckPayment([FromRoute] string code)
    {
        var result = await Sender.Send(new CheckPaymentNowCommand(code));
        return HandleResult(result);
    }

    [AllowAnonymous]
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

    [AllowAnonymous]
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

    [AllowAnonymous]
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
