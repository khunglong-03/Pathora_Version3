using Microsoft.Extensions.Configuration;
using Npgsql;
using StackExchange.Redis;

namespace Domain.Specs.Infrastructure;

public sealed class ConnectionHealthCheckTests : IDisposable
{
    private readonly string _solutionRoot;
    private readonly string _postgresConnectionString;
    private readonly string _redisConnectionString;

    public ConnectionHealthCheckTests()
    {
        _solutionRoot = FindSolutionRoot();

        var config = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(_solutionRoot, "src", "Api"))
            .AddJsonFile(Path.Combine(_solutionRoot, "src", "Api", "appsettings.json"), optional: false)
            .AddJsonFile(Path.Combine(_solutionRoot, "src", "Api", $"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"}.json"), optional: true)
            .Build();

        _postgresConnectionString = config.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured in appsettings.json.");
        _redisConnectionString = config["Redis:ConnectionString"] ?? "localhost:6379";
    }

    [Fact]
    public async Task Postgres_WhenConnecting_ShouldSucceed()
    {
        // Arrange & Act
        await using var connection = new NpgsqlDataSourceBuilder(_postgresConnectionString).Build();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT 1;";

        // Assert
        await using var reader = await command.ExecuteReaderAsync();
        var hasRows = await reader.ReadAsync();

        Assert.True(hasRows, "PostgreSQL query should return rows.");
        Assert.Equal(1, reader.GetInt32(0));
    }

    [Fact]
    public async Task Redis_WhenConnecting_ShouldSucceed()
    {
        // Arrange
        var redisOptions = ConfigurationOptions.Parse(_redisConnectionString);
        // Force IPv4 — localhost resolves to ::1 (IPv6) first but Redis Docker listens IPv4 only
        redisOptions.EndPoints.Clear();
        redisOptions.EndPoints.Add("127.0.0.1:6379");
        redisOptions.Password = "redis";
        redisOptions.AbortOnConnectFail = false;
        redisOptions.ConnectTimeout = 8000;
        redisOptions.SyncTimeout = 8000;

        // Act
        await using var connection = await ConnectionMultiplexer.ConnectAsync(redisOptions);

        // Assert
        Assert.True(connection.IsConnected, "Redis should be connected.");

        var db = connection.GetDatabase();
        var pingResult = await db.PingAsync();

        Assert.True(pingResult.TotalMilliseconds > 0, "Redis PING should return a valid latency.");
    }

    [Fact]
    public async Task Postgres_WhenQueryingVersion_ShouldReturnVersion()
    {
        // Arrange & Act
        await using var connection = new NpgsqlDataSourceBuilder(_postgresConnectionString).Build();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT version();";
        await using var reader = await command.ExecuteReaderAsync();
        await reader.ReadAsync();

        var version = reader.GetString(0);

        // Assert
        Assert.NotEmpty(version);
        Assert.Contains("PostgreSQL", version, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Redis_WhenSettingAndGettingValue_ShouldWork()
    {
        // Arrange
        var redisOptions = ConfigurationOptions.Parse(_redisConnectionString);
        // Force IPv4 — localhost resolves to ::1 (IPv6) first but Redis Docker listens IPv4 only
        redisOptions.EndPoints.Clear();
        redisOptions.EndPoints.Add("127.0.0.1:6379");
        redisOptions.Password = "redis";
        redisOptions.AbortOnConnectFail = false;
        redisOptions.ConnectTimeout = 8000;
        redisOptions.SyncTimeout = 8000;

        await using var connection = await ConnectionMultiplexer.ConnectAsync(redisOptions);
        var db = connection.GetDatabase();
        var key = $"healthcheck:test:{Guid.NewGuid()}";
        var expected = "pong";

        try
        {
            // Act
            await db.StringSetAsync(key, expected, TimeSpan.FromSeconds(30));
            var actual = await db.StringGetAsync(key);

            // Assert
            Assert.Equal(expected, actual.ToString());
        }
        finally
        {
            await db.KeyDeleteAsync(key);
        }
    }

    private static string FindSolutionRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "LocalService.slnx")))
                return current.FullName;
            current = current.Parent;
        }
        throw new InvalidOperationException("Could not locate LocalService.slnx.");
    }

    public void Dispose()
    {
        // Cleanup if needed
    }
}
