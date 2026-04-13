using Contracts.Interfaces;
using Serilog;

namespace Api;

public static class DependencyInjection
{
    private const string ServiceName = ServiceMetadataConstants.ServiceName;

    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RateLimitOptions>(configuration.GetSection("RateLimit"));
        services.AddSwaggerServices(configuration);

        // Add case-insensitive JSON deserialization
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
                options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                options.JsonSerializerOptions.Converters.Add(new DateOnlyJsonConverter());
                options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
            });
        services.AddResponseCaching();
        services.AddSignalR();
        services.AddHttpContextAccessor();
        services.AddProblemDetails();
        services.AddExceptionHandler<ApiExceptionHandler>();

        services.Configure<ApiBehaviorOptions>(options => options.SuppressModelStateInvalidFilter = true);

        services.AddMonitoringServices(configuration);
        services.AddIdentityServices(configuration);
        services.AddRateLimiterServices(configuration);
        services.AddResponseCompressionServices();
        services.AddSingleton<IDatabaseStartupLifecycle, EfCoreDatabaseStartupLifecycle>();
        services.AddSingleton<DatabaseStartupInitializer>();

        return services;
    }

    private static IServiceCollection AddResponseCompressionServices(this IServiceCollection services)
    {
        services.AddResponseCompression(options =>
        {
            options.EnableForHttps = true;
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
            options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
            [
                "application/json",
                "text/plain",
                "text/html"
            ]);
        });

        services.Configure<BrotliCompressionProviderOptions>(options =>
            options.Level = CompressionLevel.Fastest);

        services.Configure<GzipCompressionProviderOptions>(options =>
            options.Level = CompressionLevel.SmallestSize);

        return services;
    }

    private static IServiceCollection AddRateLimiterServices(this IServiceCollection services, IConfiguration configuration)
    {
        var rateLimitOptions = configuration.GetSection("RateLimit").Get<RateLimitOptions>() ?? new RateLimitOptions();
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy("global", context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = rateLimitOptions.GlobalPermitLimit,
                        Window = TimeSpan.FromSeconds(rateLimitOptions.WindowSeconds),
                        QueueLimit = 0
                    }));

            options.AddPolicy("auth-strict", context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = rateLimitOptions.AuthPermitLimit,
                        Window = TimeSpan.FromSeconds(rateLimitOptions.WindowSeconds),
                        QueueLimit = 0
                    }));

            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
                }

                await Task.CompletedTask;
            };

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = rateLimitOptions.GlobalPermitLimit,
                        Window = TimeSpan.FromSeconds(rateLimitOptions.WindowSeconds),
                        QueueLimit = 0
                    }));
        });

        return services;
    }

    private static IServiceCollection AddMonitoringServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        using var listener = new ActivityListener();
        listener.ShouldListenTo = _ => true;
        listener.Sample = (ref _) => ActivitySamplingResult.AllData;
        ActivitySource.AddActivityListener(listener);
        var source = new ActivitySource("QLMM", "1.0.0");

        services.AddSerilog((serviceProvider, lc) => lc
            .ReadFrom.Configuration(configuration)
            .ReadFrom.Services(serviceProvider)
            .Enrich.FromLogContext()
            .Enrich.WithSpan()
            .WriteTo.Console(new ExpressionTemplate(
                "[{@t:HH:mm:ss} {@l:u3}{#if @tr is not null} ({substring(@tr,0,4)}:{substring(@sp,0,4)}){#end}] {@m}\n{@x}",
                theme: TemplateTheme.Code))
            .WriteTo.OpenTelemetry(opts =>
                {
                    opts.ResourceAttributes = new Dictionary<string, object>
                    {
                        ["service.name"] = ServiceName
                    };
                    opts.Endpoint = configuration["OpenTelemetry:Endpoint"]!;
                    opts.Protocol = OtlpProtocol.HttpProtobuf;
                },
                true));

        //services.AddOpenTelemetry()
        //    .ConfigureResource(resource => resource.AddService(ServiceName))
        //    .UseOtlpExporter(OtlpExportProtocol.HttpProtobuf, new Uri(configuration["OpenTelemetry:Endpoint"]!))
        //    .WithTracing(tracing => tracing
        //        .AddHttpClientInstrumentation()
        //        .AddAspNetCoreInstrumentation())
        //    .WithMetrics(metrics => metrics
        //        .AddHttpClientInstrumentation()
        //        .AddAspNetCoreInstrumentation());

        return services;
    }

    private static IServiceCollection AddIdentityServices(this IServiceCollection services, IConfiguration configuration)
    {
        var isAuthDisabled = configuration.GetValue<bool>("Auth:DisableAuthorization");

        services.AddAuthorization(options =>
        {
            // When DisableAuthorization is true, allow unauthenticated access by default.
            // Individual endpoints with [Authorize] still require auth.
            // Endpoints with [AllowAnonymous] bypass auth regardless.
            options.FallbackPolicy = isAuthDisabled
                ? null
                : new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
            options.DefaultPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();

            options.AddPolicy("AdminOnly", policy =>
                policy.RequireRole("Admin"));

            // ManagerOnly: Admin is included because seed data admin users have role "Admin",
            // not "Manager". Admin is a superuser with full access including manager operations.
            options.AddPolicy("ManagerOnly", policy =>
                policy.RequireAssertion(context =>
                    context.User.IsInRole("Admin") || context.User.IsInRole("Manager")));

            // TransportProviderOnly: Admin OR TransportProvider (fleet management)
            options.AddPolicy("TransportProviderOnly", policy =>
                policy.RequireAssertion(context =>
                    context.User.IsInRole("Admin") || context.User.IsInRole("TransportProvider")));

            // BookingTransportOnly: Admin OR Manager OR TransportProvider (booking transport assignments)
            options.AddPolicy("BookingTransportOnly", policy =>
                policy.RequireAssertion(context =>
                    context.User.IsInRole("Admin") || context.User.IsInRole("Manager") || context.User.IsInRole("TransportProvider")));

            // HotelServiceProviderOnly: Admin OR HotelServiceProvider
            options.AddPolicy("HotelServiceProviderOnly", policy =>
                policy.RequireAssertion(context =>
                    context.User.IsInRole("Admin") || context.User.IsInRole("HotelServiceProvider")));

            // CustomerOnly: Admin OR Customer (customer portal endpoints)
            options.AddPolicy("CustomerOnly", policy =>
                policy.RequireAssertion(context =>
                    context.User.IsInRole("Admin") || context.User.IsInRole("Customer")));

            // TourAdminOnly: Admin OR Manager (admin-scoped ops: participants, suppliers, payables)
            options.AddPolicy("TourAdminOnly", policy =>
                policy.RequireAssertion(context =>
                    context.User.IsInRole("Admin") || context.User.IsInRole("Manager")));

            // TourManagerOnly: Admin OR Manager OR TourDesigner (tour lifecycle management)
            options.AddPolicy("TourManagerOnly", policy =>
                policy.RequireAssertion(context =>
                    context.User.IsInRole("Admin") || context.User.IsInRole("Manager") || context.User.IsInRole("TourDesigner")));

            // TourGuideOnly: Admin OR TourGuide (tour guide specific operations)
            options.AddPolicy("TourGuideOnly", policy =>
                policy.RequireAssertion(context =>
                    context.User.IsInRole("Admin") || context.User.IsInRole("TourGuide")));

            // CanManageTour: Resource-based authorization for strict ownership validation
            options.AddPolicy("CanManageTour", policy =>
                policy.Requirements.Add(new global::Infrastructure.Identity.Authorization.ManageTourRequirement()));
        });

        services.AddScoped<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, global::Infrastructure.Identity.Authorization.ManageTourRequirementHandler>();
        services.AddSingleton<IUser, CurrentUser>();
        services.AddSingleton<IToken, CurrentToken>();
        services.AddScoped<IPaymentNotificationService, PaymentNotificationService>();
        services.AddScoped<IPaymentNotificationBroadcaster, PaymentNotificationService>();

        return services;
    }
}
