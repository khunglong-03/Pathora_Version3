using System.Net;

namespace Application.Options;

public sealed class SePayOptions
{
    public const string SePay = "SePay";
    public string ApiUrl { get; init; } = "";
    public string AccountNumber { get; init; } = "";
    public string ApiKey { get; init; } = "";
    public string WebhookSecret { get; init; } = "";
    public string AllowedIps { get; init; } = "";
    public string WebhookPath { get; init; } = "/api/payment/sepay/webhook";
    public string CallbackBaseUrl { get; init; } = "";
    public string CallbackUrl { get; init; } = "";
    public string NgrokAuthtoken { get; init; } = "";

    public IReadOnlyCollection<IPAddress> GetAllowedIpAddresses()
    {
        if (string.IsNullOrWhiteSpace(AllowedIps))
        {
            return Array.Empty<IPAddress>();
        }

        return AllowedIps
            .Split([',', ';', '\n', '\r'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(NormalizeConfigValue)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(ParseIpAddress)
            .Where(ip => ip is not null)
            .Cast<IPAddress>()
            .ToArray();
    }

    public string? GetEffectiveCallbackUrl()
    {
        var explicitUrl = NormalizeConfigValue(CallbackUrl);
        if (!string.IsNullOrWhiteSpace(explicitUrl))
        {
            return explicitUrl;
        }

        var baseUrl = NormalizeConfigValue(CallbackBaseUrl);
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return null;
        }

        var normalizedPath = string.IsNullOrWhiteSpace(WebhookPath)
            ? "/api/payment/sepay/webhook"
            : WebhookPath.Trim();

        return $"{baseUrl.TrimEnd('/')}/{normalizedPath.TrimStart('/')}";
    }

    private static IPAddress? ParseIpAddress(string value)
        => IPAddress.TryParse(value, out var ipAddress)
            ? NormalizeIpAddress(ipAddress)
            : null;

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

    private static IPAddress NormalizeIpAddress(IPAddress ipAddress)
        => ipAddress.IsIPv4MappedToIPv6 ? ipAddress.MapToIPv4() : ipAddress;
}
