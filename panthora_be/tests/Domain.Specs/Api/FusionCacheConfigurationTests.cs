using System.Linq;

using Infrastructure;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ZiggyCreatures.Caching.Fusion;

namespace Domain.Specs.Api;

public sealed class FusionCacheConfigurationTests
{
    [Fact]
    public void AddInfrastructureServices_WhenRedisConfigured_ShouldResolveFusionCache()
    {
        var configuration = CreateConfiguration();

        var services = new ServiceCollection();
        services.AddInfrastructureServices(configuration);

        using var provider = services.BuildServiceProvider();

        var exception = Record.Exception(() => provider.GetRequiredService<IFusionCache>());

        Assert.Null(exception);
    }

    [Fact]
    public void AddInfrastructureServices_WhenRedisConfiguredInProduction_ShouldRegisterDistributedCache()
    {
        var configuration = CreateConfiguration(environment: "Production");

        var services = new ServiceCollection();
        services.AddInfrastructureServices(configuration);

        var distributedCacheRegistration = services.FirstOrDefault(service => service.ServiceType == typeof(IDistributedCache));

        Assert.NotNull(distributedCacheRegistration);
    }

    [Fact]
    public void AddInfrastructureServices_WhenRedisConfiguredInDevelopment_ShouldNotRegisterDistributedCache()
    {
        var configuration = CreateConfiguration(environment: "Development");

        var services = new ServiceCollection();
        services.AddInfrastructureServices(configuration);

        var distributedCacheRegistration = services.FirstOrDefault(service => service.ServiceType == typeof(IDistributedCache));

        Assert.Null(distributedCacheRegistration);
    }

    private static IConfiguration CreateConfiguration(string environment = "Production")
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ASPNETCORE_ENVIRONMENT"] = environment,
                ["ConnectionStrings:Default"] = "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres",
                ["Redis:ConnectionString"] = "34.143.220.132:6379,ssl=True,abortConnect=False",
                ["Jwt:Secret"] = "QWERTYUIOP12349876AASDFGHJKLMNBVCXZQWERTYUIOP12349876AASDFGHJKLMNBVCXZ",
                ["Jwt:Issuer"] = "http://localhost:8080",
                ["Jwt:Audience"] = "http://localhost:8080",
                ["Cloudinary:CloudName"] = "test-cloud",
                ["Cloudinary:ApiKey"] = "test-key",
                ["Cloudinary:ApiSecret"] = "test-secret"
            })
            .Build();
    }
}
