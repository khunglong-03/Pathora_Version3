namespace Infrastructure.Options;

public class DatabaseOptions
{
    public const string Database = "Database";
    public int CommandTimeoutSeconds { get; init; } = 120;
    public int MaxRetryCount { get; init; } = 3;
}
