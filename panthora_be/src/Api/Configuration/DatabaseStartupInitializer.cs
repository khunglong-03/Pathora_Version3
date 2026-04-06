using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Serilog;

namespace Api.Configuration;

public sealed class DatabaseStartupInitializer(
    IConfiguration configuration,
    IHostEnvironment hostEnvironment,
    IDatabaseStartupLifecycle lifecycle)
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private bool _initialized;

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        var resetAndReseedEnabled = configuration.IsResetAndReseedOnStartupEnabled();
        if (!resetAndReseedEnabled)
        {
            return;
        }

        if (!hostEnvironment.IsDevelopment())
        {
            Log.Warning("Ignored Dev:ResetAndReseedOnStartup because environment is '{EnvironmentName}'", hostEnvironment.EnvironmentName);
            return;
        }

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

            Log.Warning("Dev reset-and-reseed mode is enabled. Existing database data will be removed.");

            await lifecycle.EnsureDeletedAsync(cancellationToken);
            await lifecycle.MigrateAsync(cancellationToken);
            await lifecycle.SeedFreshAsync(cancellationToken);

            _initialized = true;
            Log.Information("Development database reset-and-reseed initialization completed successfully.");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Development database reset-and-reseed initialization failed.");
            throw;
        }
        finally
        {
            _gate.Release();
        }
    }
}
