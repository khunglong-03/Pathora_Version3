using global::Api.Configuration;
using Microsoft.Extensions.Hosting;
using NSubstitute;

namespace Domain.Specs.Api;

public sealed class DatabaseStartupInitializerTests
{
    [Fact]
    public async Task InitializeAsync_WhenSchemaDoesNotExist_ShouldMigrateAndSeedFresh()
    {
        var lifecycle = Substitute.For<IDatabaseStartupLifecycle>();
        lifecycle.HasSchemaAsync(Arg.Any<CancellationToken>()).Returns(false);
        var initializer = new DatabaseStartupInitializer(lifecycle);

        await initializer.InitializeAsync();

        await lifecycle.Received(1).MigrateAsync(Arg.Any<CancellationToken>());
        await lifecycle.Received(1).SeedFreshAsync(Arg.Any<CancellationToken>());
        await lifecycle.DidNotReceive().SeedIfNeededAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task InitializeAsync_WhenSchemaExists_ShouldRunIncrementalSeed()
    {
        var lifecycle = Substitute.For<IDatabaseStartupLifecycle>();
        lifecycle.HasSchemaAsync(Arg.Any<CancellationToken>()).Returns(true);
        var initializer = new DatabaseStartupInitializer(lifecycle);

        await initializer.InitializeAsync();

        await lifecycle.DidNotReceive().MigrateAsync(Arg.Any<CancellationToken>());
        await lifecycle.DidNotReceive().SeedFreshAsync(Arg.Any<CancellationToken>());
        await lifecycle.Received(1).SeedIfNeededAsync(Arg.Any<CancellationToken>());
    }
}

