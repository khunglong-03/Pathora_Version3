using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Serilog;

namespace Api.Configuration;

public sealed class DatabaseStartupInitializer(
    IDatabaseStartupLifecycle lifecycle)
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private bool _initialized;

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {

        // --- Mode 2: Auto-detect — migrate if schema missing, then seed if needed ---
        await RunOnceAsync(async ct =>
        {
            var schemaExists = await lifecycle.HasSchemaAsync(ct);
            if (!schemaExists)
            {
                Log.Information("Database schema not found. Running migration to create tables...");
                await lifecycle.MigrateAsync(ct);
                Log.Information("Database migration completed. Seeding initial data...");
                await lifecycle.SeedFreshAsync(ct);
                Log.Information("Database schema creation and initial seed completed successfully.");
            }
            else
            {
                Log.Information("Database schema exists. Running incremental seed if needed...");
                await lifecycle.SeedIfNeededAsync(ct);
                Log.Information("Incremental seed check completed.");
            }
        }, cancellationToken);
    }

    private async Task RunOnceAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken)
    {
        if (_initialized)
        {
            return;
        }

        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (_initialized)
            {
                return;
            }

            await action(cancellationToken);
            _initialized = true;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Database startup initialization failed.");
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }
}
