namespace Infrastructure.Options;

public class CacheOptions
{
    public const string Cache = "Cache";
    public int DefaultExpirationMinutes { get; init; } = 5;
}
