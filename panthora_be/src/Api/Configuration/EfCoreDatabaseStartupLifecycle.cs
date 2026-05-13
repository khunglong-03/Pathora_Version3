using Infrastructure.Data;
using Infrastructure.Data.Seed;
using Microsoft.EntityFrameworkCore;

namespace Api.Configuration;

public sealed class EfCoreDatabaseStartupLifecycle(IServiceScopeFactory scopeFactory) : IDatabaseStartupLifecycle
{
    public async Task EnsureDeletedAsync(CancellationToken cancellationToken)
    {
        //await ExecuteAsync(
        //    (dbContext, token) => dbContext.Database.EnsureDeletedAsync(token),
        //    cancellationToken);
    }

    public async Task MigrateAsync(CancellationToken cancellationToken)
    {
        await ExecuteAsync(
            (dbContext, token) => dbContext.Database.EnsureCreatedAsync(token),
            cancellationToken);
    }

    public async Task SeedFreshAsync(CancellationToken cancellationToken)
    {
        await ExecuteAsync(AppDbContextSeed.SeedFreshAsync, cancellationToken);
    }

    public async Task SeedIfNeededAsync(CancellationToken cancellationToken)
    {
        await ExecuteAsync(async (context, token) => await AppDbContextSeed.SeedIfNeededAsync(context, token), cancellationToken);
    }

    public async Task<bool> HasSchemaAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        try
        {
            // Try to query a known table. If it exists, schema is present.
            _ = await dbContext.Roles.CountAsync(cancellationToken);
            return true;
        }
        catch (Npgsql.PostgresException ex) when (ex.SqlState == "42P01")
        {
            // 42P01 = relation does not exist → schema not created yet
            return false;
        }
    }

    private async Task ExecuteAsync(
        Func<AppDbContext, CancellationToken, Task> action,
        CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await action(dbContext, cancellationToken);
    }
}
