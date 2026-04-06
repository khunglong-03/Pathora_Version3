using Api.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using NSubstitute;

namespace Domain.Specs.Api;

public sealed class DatabaseStartupInitializerTests
{
    [Fact]
    public async Task InitializeAsync_WhenResetFlagDisabled_ShouldSkipLifecycle()
    {
        var configuration = CreateConfiguration(resetAndReseedOnStartup: false);
        var hostEnvironment = CreateHostEnvironment(Environments.Development);
        var lifecycle = Substitute.For<IDatabaseStartupLifecycle>();
        var initializer = new DatabaseStartupInitializer(configuration, hostEnvironment, lifecycle);

        await initializer.InitializeAsync();

        await lifecycle.DidNotReceive().EnsureDeletedAsync(Arg.Any<CancellationToken>());
        await lifecycle.DidNotReceive().MigrateAsync(Arg.Any<CancellationToken>());
        await lifecycle.DidNotReceive().SeedFreshAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task InitializeAsync_WhenEnvironmentIsNotDevelopment_ShouldSkipLifecycleEvenIfFlagEnabled()
    {
        var configuration = CreateConfiguration(resetAndReseedOnStartup: true);
        var hostEnvironment = CreateHostEnvironment(Environments.Production);
        var lifecycle = Substitute.For<IDatabaseStartupLifecycle>();
        var initializer = new DatabaseStartupInitializer(configuration, hostEnvironment, lifecycle);

        await initializer.InitializeAsync();

        await lifecycle.DidNotReceive().EnsureDeletedAsync(Arg.Any<CancellationToken>());
        await lifecycle.DidNotReceive().MigrateAsync(Arg.Any<CancellationToken>());
        await lifecycle.DidNotReceive().SeedFreshAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task InitializeAsync_WhenEnabledInDevelopment_ShouldRunLifecycleInOrderOnce()
    {
        var configuration = CreateConfiguration(resetAndReseedOnStartup: true);
        var hostEnvironment = CreateHostEnvironment(Environments.Development);
        var lifecycle = Substitute.For<IDatabaseStartupLifecycle>();
        var initializer = new DatabaseStartupInitializer(configuration, hostEnvironment, lifecycle);

        await initializer.InitializeAsync();
        await initializer.InitializeAsync();

        await lifecycle.Received(1).EnsureDeletedAsync(Arg.Any<CancellationToken>());
        await lifecycle.Received(1).MigrateAsync(Arg.Any<CancellationToken>());
        await lifecycle.Received(1).SeedFreshAsync(Arg.Any<CancellationToken>());

        Received.InOrder(() =>
        {
            lifecycle.EnsureDeletedAsync(Arg.Any<CancellationToken>());
            lifecycle.MigrateAsync(Arg.Any<CancellationToken>());
            lifecycle.SeedFreshAsync(Arg.Any<CancellationToken>());
        });
    }

    [Fact]
    public async Task InitializeAsync_WhenSeedingFails_ShouldThrow()
    {
        var configuration = CreateConfiguration(resetAndReseedOnStartup: true);
        var hostEnvironment = CreateHostEnvironment(Environments.Development);
        var lifecycle = Substitute.For<IDatabaseStartupLifecycle>();
        lifecycle.SeedFreshAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromException(new InvalidOperationException("seed failed")));
        var initializer = new DatabaseStartupInitializer(configuration, hostEnvironment, lifecycle);

        await Assert.ThrowsAsync<InvalidOperationException>(() => initializer.InitializeAsync());
    }

    [Fact]
    public async Task InitializeAsync_WhenFirstAttemptFails_ShouldAllowSecondAttempt()
    {
        var configuration = CreateConfiguration(resetAndReseedOnStartup: true);
        var hostEnvironment = CreateHostEnvironment(Environments.Development);
        var lifecycle = Substitute.For<IDatabaseStartupLifecycle>();
        var attempt = 0;
        lifecycle.SeedFreshAsync(Arg.Any<CancellationToken>())
            .Returns(_ =>
            {
                attempt++;
                return attempt == 1
                    ? Task.FromException(new InvalidOperationException("seed failed"))
                    : Task.CompletedTask;
            });
        var initializer = new DatabaseStartupInitializer(configuration, hostEnvironment, lifecycle);

        await Assert.ThrowsAsync<InvalidOperationException>(() => initializer.InitializeAsync());
        await initializer.InitializeAsync();

        await lifecycle.Received(2).EnsureDeletedAsync(Arg.Any<CancellationToken>());
        await lifecycle.Received(2).MigrateAsync(Arg.Any<CancellationToken>());
        await lifecycle.Received(2).SeedFreshAsync(Arg.Any<CancellationToken>());
    }

    private static IConfiguration CreateConfiguration(bool resetAndReseedOnStartup)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Dev:ResetAndReseedOnStartup"] = resetAndReseedOnStartup.ToString(),
            })
            .Build();
    }

    private static IHostEnvironment CreateHostEnvironment(string environmentName)
    {
        var environment = Substitute.For<IHostEnvironment>();
        environment.EnvironmentName.Returns(environmentName);
        return environment;
    }
}
