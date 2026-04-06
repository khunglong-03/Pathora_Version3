namespace Infrastructure.Options;

public class StorageOptions
{
    public int HttpTimeoutSeconds { get; init; } = 30;
    public string DefaultFolder { get; init; } = "panthora";
}
