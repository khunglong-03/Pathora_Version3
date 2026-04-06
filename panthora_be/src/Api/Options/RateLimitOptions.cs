namespace Api.Options;

public class RateLimitOptions
{
    public int GlobalPermitLimit { get; init; } = 100;
    public int AuthPermitLimit { get; init; } = 20;
    public int WindowSeconds { get; init; } = 60;
}
