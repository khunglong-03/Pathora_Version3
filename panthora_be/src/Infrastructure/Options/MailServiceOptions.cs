namespace Infrastructure.Options;

public class MailServiceOptions
{
    public int MaxRetryAttempts { get; init; } = 3;
    public int MaxRetryDelayMs { get; init; } = 1500;
    public int TimeoutSeconds { get; init; } = 30;
    public int EmailConfirmationExpiryMinutes { get; init; } = 180;
}
