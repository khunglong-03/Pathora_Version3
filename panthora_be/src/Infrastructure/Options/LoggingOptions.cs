namespace Infrastructure.Options;

public class LoggingOptions
{
    public int LogBatchSize { get; init; } = 50;
    public int LogFlushDelayMs { get; init; } = 5000;
}
