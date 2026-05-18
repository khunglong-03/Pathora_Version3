using System.Net.Http.Json;
using Application.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ApiPublic.Infrastructure;

/// <summary>
/// Forwards payment status broadcasts to the private Api (SignalR hub lives there).
/// PublicApi SePay webhook reconciles DB but cannot push to clients without this.
/// </summary>
public sealed class ApiInternalPaymentNotificationBroadcaster(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<ApiInternalPaymentNotificationBroadcaster> logger) : IPaymentNotificationBroadcaster
{
    public async Task BroadcastAsync(PaymentStatusSnapshot snapshot, CancellationToken ct = default)
    {
        var baseUrl = (configuration["InternalApi:BaseUrl"] ?? "http://backend:8080").TrimEnd('/');
        var secret = configuration["InternalApi:BroadcastSecret"]?.Trim();

        try
        {
            var client = httpClientFactory.CreateClient(nameof(ApiInternalPaymentNotificationBroadcaster));
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"{baseUrl}/api/internal/notifications/payment-update");

            if (!string.IsNullOrEmpty(secret))
            {
                request.Headers.TryAddWithoutValidation("X-Internal-Broadcast-Key", secret);
            }

            request.Content = JsonContent.Create(snapshot, cancellationToken: ct);

            using var response = await client.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                logger.LogWarning(
                    "Internal payment broadcast failed for {TransactionCode}: HTTP {StatusCode} {Body}",
                    snapshot.TransactionCode,
                    (int)response.StatusCode,
                    body);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Internal payment broadcast error for {TransactionCode}",
                snapshot.TransactionCode);
        }
    }
}
