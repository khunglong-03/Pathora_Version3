using System.Net.Http;
using Contracts.Interfaces;
using Domain.Options;
using Infrastructure.Data;
using Infrastructure.Files;
using Infrastructure.Identity;
using Infrastructure.Localization;
using Infrastructure.Loging;
using Infrastructure.Mails;
using Infrastructure.Options;
using Infrastructure.Repositories.Common;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Http.Resilience;
using ZiggyCreatures.Caching.Fusion;
using ZiggyCreatures.Caching.Fusion.Serialization.SystemTextJson;
using Application.Services;
using Application.Options;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<DatabaseOptions>(configuration.GetSection(DatabaseOptions.Database));
        services.Configure<CacheOptions>(configuration.GetSection(CacheOptions.Cache));
        services.Configure<TourOptions>(configuration.GetSection(TourOptions.Tour));
        services.Configure<LoggingOptions>(configuration.GetSection("Logging"));

        var databaseOptions = configuration.GetSection(DatabaseOptions.Database).Get<DatabaseOptions>() ?? new DatabaseOptions();
        var cacheOptions = configuration.GetSection(CacheOptions.Cache).Get<CacheOptions>() ?? new CacheOptions();

        return services
           .AddScoped<HotelServiceProviderSupplierMapper>()
           .AddScoped<Application.Common.Interfaces.ICurrentUser, CurrentUserService>()
           .AddDbContext<AppDbContext>(options =>
            {
                options.UseNpgsql(configuration.GetConnectionString("Default"), npgsqlOptions =>
                {
                    npgsqlOptions.CommandTimeout(databaseOptions.CommandTimeoutSeconds);
                    npgsqlOptions.EnableRetryOnFailure(databaseOptions.MaxRetryCount);
                });
            })
            .AddLogingService(configuration)
            .AddIdentityServices(configuration)
            .AddMailService(configuration)
            .AddFileService(configuration)
            .AddCacheService(configuration, cacheOptions)
            .AddScoped<ILanguageContext, LanguageContext>()
            .AddRepositories(configuration)
            .AddSePayServices(configuration);
    }

    private static IServiceCollection AddSePayServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<SePayOptions>(configuration.GetSection(SePayOptions.SePay));
        services.AddHttpClient<ISePayApiClient, SePayApiClient>()
            .AddStandardResilienceHandler(options =>
            {
                // Retry: 3 attempts with exponential backoff (2s, 4s, 8s)
                options.Retry.MaxRetryAttempts = 3;
                options.Retry.UseJitter = true;
                options.Retry.Delay = TimeSpan.FromSeconds(2);

                // Circuit breaker: 5 failures in 30s opens, 30s half-open
                options.CircuitBreaker.FailureRatio = 0.5;
                options.CircuitBreaker.MinimumThroughput = 5;
                options.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(30);
                options.CircuitBreaker.BreakDuration = TimeSpan.FromSeconds(30);
            });
        return services;
    }

    private static IServiceCollection AddCacheService(this IServiceCollection services, IConfiguration configuration, CacheOptions cacheOptions)
    {
        var redisConnection = configuration["Redis:ConnectionString"];
        var environment = configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT") ?? "Production";
        var isDevelopment = environment.Equals("Development", StringComparison.OrdinalIgnoreCase);

        var fusionCacheBuilder = services.AddFusionCache()
            .WithDefaultEntryOptions(new FusionCacheEntryOptions
            {
                Duration = TimeSpan.FromMinutes(cacheOptions.DefaultExpirationMinutes)
            })
            .WithSerializer(new FusionCacheSystemTextJsonSerializer());

        // Only use Redis in non-Development environments
        // In Development, use in-memory cache only (faster startup, no Redis required)
        if (!isDevelopment && !string.IsNullOrEmpty(redisConnection))
        {
            services.AddStackExchangeRedisCache(options => options.Configuration = redisConnection);
            fusionCacheBuilder.WithRegisteredDistributedCache();
        }

        return services;
    }
}
