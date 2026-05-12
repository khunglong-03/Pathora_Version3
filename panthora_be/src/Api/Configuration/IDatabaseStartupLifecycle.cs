namespace Api.Configuration;

public interface IDatabaseStartupLifecycle
{
    Task EnsureDeletedAsync(CancellationToken cancellationToken);

    Task MigrateAsync(CancellationToken cancellationToken);

    Task SeedFreshAsync(CancellationToken cancellationToken);

    Task SeedIfNeededAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Checks whether the database schema (tables) already exists.
    /// Returns true if at least one application table is present.
    /// </summary>
    Task<bool> HasSchemaAsync(CancellationToken cancellationToken);
}
