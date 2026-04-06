namespace Api.Configuration;

public interface IDatabaseStartupLifecycle
{
    Task EnsureDeletedAsync(CancellationToken cancellationToken);

    Task MigrateAsync(CancellationToken cancellationToken);

    Task SeedFreshAsync(CancellationToken cancellationToken);
}
