namespace Application.Options;

public sealed class SePayOptions
{
    public const string SePay = "SePay";
    public string ApiUrl { get; init; } = "";
    public string AccountNumber { get; init; } = "";
    public string ApiKey { get; init; } = "";
    public string WebhookSecret { get; init; } = "";
    public string AllowedIps { get; init; } = "";
}
