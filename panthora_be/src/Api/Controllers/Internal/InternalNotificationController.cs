using Api.Services;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Internal;

/// <summary>
/// Internal-only endpoints for cross-service notification (e.g. PublicApi SePay webhook → SignalR).
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/internal/notifications")]
public sealed class InternalNotificationController(
    IPaymentNotificationService notificationService,
    IConfiguration configuration,
    ILogger<InternalNotificationController> logger) : ControllerBase
{
    [HttpPost("payment-update")]
    public async Task<IActionResult> BroadcastPaymentUpdate(
        [FromBody] PaymentStatusSnapshot snapshot,
        CancellationToken cancellationToken)
    {
        if (!IsAuthorized())
        {
            logger.LogWarning("Rejected internal payment broadcast: invalid or missing broadcast key.");
            return Unauthorized();
        }

        await notificationService.BroadcastPaymentUpdateAsync(snapshot, cancellationToken);
        return Ok(new { success = true });
    }

    private bool IsAuthorized()
    {
        var expected = configuration["InternalApi:BroadcastSecret"]?.Trim();
        if (string.IsNullOrEmpty(expected))
        {
            return true;
        }

        return Request.Headers.TryGetValue("X-Internal-Broadcast-Key", out var provided)
               && string.Equals(provided.ToString(), expected, StringComparison.Ordinal);
    }
}
