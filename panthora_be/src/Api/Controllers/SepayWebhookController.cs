using System.Net;
using System.Net.Http.Headers;

using Api.Endpoint;
using Application.Contracts.Payment;
using Application.Options;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route(PaymentEndpoint.Base)]
public sealed class SepayWebhookController(
    IPaymentReconciliationService paymentReconciliationService,
    IOptions<SePayOptions> sePayOptions,
    ILogger<SepayWebhookController> logger) : ControllerBase
{
    private readonly IPaymentReconciliationService _paymentReconciliationService = paymentReconciliationService;
    private readonly SePayOptions _sePayOptions = sePayOptions.Value;
    private readonly ILogger<SepayWebhookController> _logger = logger;

    [HttpPost(PaymentEndpoint.SepayWebhook)]
    public async Task<IActionResult> ReceiveWebhook([FromBody] SepayWebhookRequest request, CancellationToken cancellationToken)
    {
        if (!IsAuthorizationValid())
        {
            return Unauthorized(new { success = false, message = "Invalid webhook authorization." });
        }

        if (!IsCallerIpAllowed())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = "Webhook caller IP is not allowed." });
        }

        if (!request.IsInboundTransfer)
        {
            _logger.LogDebug(
                "Ignoring SePay webhook {TransactionId} because transferType={TransferType}.",
                request.Id,
                request.TransferType);

            return Ok(new { success = true, ignored = true });
        }

        var result = await _paymentReconciliationService.ReconcileProviderCallbackAsync(
            request.ToTransactionData(),
            source: "sepay-webhook");

        if (result.IsError)
        {
            _logger.LogWarning(
                "Ignoring SePay webhook {TransactionId}. Errors: {Errors}",
                request.Id,
                string.Join(", ", result.Errors.Select(error => error.Description)));

            return Ok(new { success = true, ignored = true });
        }

        _logger.LogInformation(
            "SePay webhook reconciled transaction {TransactionCode} from webhook id {WebhookId}.",
            result.Value.TransactionCode,
            request.Id);

        return Ok(new { success = true });
    }

    private bool IsAuthorizationValid()
    {
        var configuredToken = GetConfiguredWebhookToken();
        if (string.IsNullOrWhiteSpace(configuredToken))
        {
            return true;
        }

        if (!Request.Headers.TryGetValue("Authorization", out var authorizationHeader))
        {
            _logger.LogWarning("Rejected SePay webhook because Authorization header is missing.");
            return false;
        }

        if (!AuthenticationHeaderValue.TryParse(authorizationHeader, out var parsedAuthorization)
            || !string.Equals(parsedAuthorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase)
            || string.IsNullOrWhiteSpace(parsedAuthorization.Parameter))
        {
            _logger.LogWarning("Rejected SePay webhook because Authorization header is not a valid Bearer token.");
            return false;
        }

        var matches = string.Equals(
            parsedAuthorization.Parameter,
            configuredToken,
            StringComparison.Ordinal);

        if (!matches)
        {
            _logger.LogWarning("Rejected SePay webhook because Authorization bearer token does not match the configured token.");
        }

        return matches;
    }

    private string GetConfiguredWebhookToken()
    {
        var apiKey = NormalizeConfigValue(_sePayOptions.ApiKey);
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            return apiKey;
        }

        return NormalizeConfigValue(_sePayOptions.WebhookSecret);
    }

    private bool IsCallerIpAllowed()
    {
        var allowedIps = _sePayOptions.GetAllowedIpAddresses();
        if (allowedIps.Count == 0)
        {
            return true;
        }

        var callerIp = ResolveCallerIp();
        if (callerIp == null)
        {
            _logger.LogWarning("Rejected SePay webhook because caller IP could not be resolved.");
            return false;
        }

        var normalizedCallerIp = callerIp.IsIPv4MappedToIPv6 ? callerIp.MapToIPv4() : callerIp;
        var allowed = allowedIps.Contains(normalizedCallerIp);
        if (!allowed)
        {
            _logger.LogWarning(
                "Rejected SePay webhook from IP {CallerIp}. Allowed IPs: {AllowedIps}",
                normalizedCallerIp,
                string.Join(", ", allowedIps.Select(ip => ip.ToString())));
        }

        return allowed;
    }

    private IPAddress? ResolveCallerIp()
    {
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
        {
            var firstForwardedIp = forwardedFor
                .ToString()
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .FirstOrDefault();

            if (IPAddress.TryParse(firstForwardedIp, out var parsedForwardedIp))
            {
                return parsedForwardedIp;
            }
        }

        return HttpContext.Connection.RemoteIpAddress;
    }

    private static string NormalizeConfigValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var trimmed = value.Trim();
        if (trimmed.StartsWith("${", StringComparison.Ordinal) && trimmed.EndsWith("}", StringComparison.Ordinal))
        {
            return string.Empty;
        }

        return trimmed;
    }
}
