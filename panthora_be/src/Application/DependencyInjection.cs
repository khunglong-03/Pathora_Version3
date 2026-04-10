using System.Reflection;
using Application.Common.Behaviors;
using Application.Services;
using BuildingBlocks.Behaviors;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
            cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
            cfg.AddOpenBehavior(typeof(CachingBehavior<,>));
            cfg.AddOpenBehavior(typeof(CacheInvalidationBehavior<,>));
        });
        services.AddSingleton<CacheKeyTracker>();
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        services.AddAutoMapper(Assembly.GetExecutingAssembly());
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IFileService, FileService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IPositionService, PositionService>();
        services.AddScoped<ISystemKeyService, SystemKeyService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ITourService, TourService>();
        services.AddScoped<ITourInstanceService, TourInstanceService>();
        services.AddScoped<IVisaPolicyService, VisaPolicyService>();
        services.AddScoped<IDepositPolicyService, DepositPolicyService>();
        services.AddScoped<ITaxConfigService, TaxConfigService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IPaymentReconciliationService, PaymentReconciliationService>();
        services.AddSingleton<IRateLimitService>(sp =>
        {
            var config = sp.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
            var rateLimitStr = config["Payment:RateLimitSeconds"];
            var rateLimitSeconds = int.TryParse(rateLimitStr, out var v) && v > 0 ? v : 5;
            // Phase 5.5.1: Inject IDistributedCache for Redis-backed rate limiting.
            // IDistributedCache is available in non-Development environments (see Infrastructure/DependencyInjection.cs).
            // In Development, it will be null and RateLimitService falls back to in-memory ConcurrentDictionary.
            var distributedCache = sp.GetService<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();
            return new RateLimitService(rateLimitSeconds,
                sp.GetRequiredService<ILogger<RateLimitService>>(),
                distributedCache);
        });
        services.AddScoped<IOwnershipValidator, OwnershipValidator>();
        services.AddScoped<IPricingPolicyService, PricingPolicyService>();
        services.AddScoped<ICancellationPolicyService, CancellationPolicyService>();

        return services;
    }
}
