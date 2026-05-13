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
using Application.Common.Interfaces;

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
        services.Configure<ProviderAssignmentOptions>(configuration.GetSection(ProviderAssignmentOptions.ProviderAssignment));
        services.Configure<LoggingOptions>(configuration.GetSection("Logging"));

        var databaseOptions = configuration.GetSection(DatabaseOptions.Database).Get<DatabaseOptions>() ?? new DatabaseOptions();
        var cacheOptions = configuration.GetSection(CacheOptions.Cache).Get<CacheOptions>() ?? new CacheOptions();

        return services
           .AddScoped<HotelServiceProviderSupplierMapper>()
           .AddScoped<Application.Common.Interfaces.ICurrentUser, CurrentUserService>()
          .AddDbContext<AppDbContext>(options =>
          {
              var connectionString = configuration.GetSection("ConnectionStrings:Default").Value;

              // Khởi tạo builder để xử lý chuỗi kết nối
              var builder = new Npgsql.NpgsqlConnectionStringBuilder(connectionString);
              options.UseNpgsql(builder.ConnectionString, npgsqlOptions =>
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
            .AddScoped<IResourceAvailabilityService, ResourceAvailabilityService>()
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

        var fusionCacheBuilder = services.AddFusionCache()
            .WithDefaultEntryOptions(new FusionCacheEntryOptions
            {
                Duration = TimeSpan.FromMinutes(cacheOptions.DefaultExpirationMinutes)
            })
            .WithSerializer(new FusionCacheSystemTextJsonSerializer());

        if (!string.IsNullOrEmpty(redisConnection))
        {
            var options = StackExchange.Redis.ConfigurationOptions.Parse(redisConnection);
            options.AbortOnConnectFail = false;
            options.ConnectTimeout = 3000;

            var multiplexer = StackExchange.Redis.ConnectionMultiplexer.Connect(options);
            services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(multiplexer);

            // 1. Thiết lập Distributed Cache (L2)
            services.AddStackExchangeRedisCache(redisOpts => redisOpts.ConfigurationOptions = options);
            fusionCacheBuilder.WithRegisteredDistributedCache();

            // 2. ĐĂNG KÝ Backplane vào hệ thống DI (Đây là bước bạn thiếu)
            services.AddFusionCacheStackExchangeRedisBackplane(backplaneOpts =>
            {
                backplaneOpts.ConfigurationOptions = options;
            });

            // 3. Nói với FusionCache: "Hãy dùng cái Backplane vừa đăng ký ở trên"
            // Method này KHÔNG có tham số nhé!
            fusionCacheBuilder.WithRegisteredBackplane();
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        return services;
    }
}
