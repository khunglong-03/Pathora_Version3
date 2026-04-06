using Infrastructure.Data;
using Infrastructure.Data.Seed;
using Microsoft.EntityFrameworkCore;

namespace Api.Configuration;

public sealed class EfCoreDatabaseStartupLifecycle(IServiceScopeFactory scopeFactory) : IDatabaseStartupLifecycle
{
    public async Task EnsureDeletedAsync(CancellationToken cancellationToken)
    {
        await ExecuteAsync(
            (dbContext, token) => dbContext.Database.EnsureDeletedAsync(token),
            cancellationToken);
    }

    public async Task MigrateAsync(CancellationToken cancellationToken)
    {
        await ExecuteAsync(
            (dbContext, token) => dbContext.Database.MigrateAsync(token),
            cancellationToken);
    }

    public async Task SeedFreshAsync(CancellationToken cancellationToken)
    {
        await ExecuteAsync(AppDbContextSeed.SeedFreshAsync, cancellationToken);
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
