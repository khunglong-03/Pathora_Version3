using Microsoft.Extensions.Configuration;

namespace Domain.Specs.Api;

public sealed class LocalPostgresDevelopmentConfigurationTests
{
    // Configuration for remote server development
    private const string ExpectedHost = "34.143.220.132";

    [Fact]
    public void ConnectionString_WhenLoadingDevelopmentConfig_ShouldUseConfiguredHost()
    {
        var apiProjectPath = Path.Combine(GetSolutionRoot(), "src", "Api");
        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiProjectPath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: false)
            .Build();

        var connectionString = configuration.GetConnectionString("Default");

        Assert.False(string.IsNullOrWhiteSpace(connectionString));
        Assert.Contains($"Host={ExpectedHost}", connectionString!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void DotEnvConnectionString_WhenLoadingEnv_ShouldUseConfiguredHost()
    {
        var envPath = Path.Combine(GetSolutionRoot(), ".env");
        var lines = File.ReadAllLines(envPath);

        var connectionLine = lines.FirstOrDefault(line =>
            line.StartsWith("ConnectionStrings__Default=", StringComparison.Ordinal));

        Assert.NotNull(connectionLine);
        Assert.Contains($"Host={ExpectedHost}", connectionLine!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ResetAndReseedFlag_WhenLoadingConfiguration_ShouldBeDisabledByDefault()
    {
        var apiProjectPath = Path.Combine(GetSolutionRoot(), "src", "Api");
        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiProjectPath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: false)
            .Build();

        var resetAndReseedEnabled = configuration.GetValue<bool>("Dev:ResetAndReseedOnStartup");

        Assert.False(resetAndReseedEnabled);
    }

    private static string GetSolutionRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var marker = Path.Combine(current.FullName, "LocalService.slnx");
            if (File.Exists(marker))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate LocalService.slnx from test execution path.");
    }
}
