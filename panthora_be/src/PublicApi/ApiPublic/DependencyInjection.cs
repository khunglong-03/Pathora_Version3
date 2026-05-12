using Microsoft.AspNetCore.DataProtection;
using System.Diagnostics;
using System.IO.Compression;
using System.Threading.RateLimiting;
using ApiPublic.Infrastructure;
using ApiPublic.Middleware;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi;
using Serilog;
using Serilog.Enrichers.Span;
using Serilog.Sinks.OpenTelemetry;
using Serilog.Templates;
using Serilog.Templates.Themes;

namespace ApiPublic;

public static class DependencyInjection
{
    private const string ServiceName = "Panthora-PublicApi";

    public static IServiceCollection AddPublicApiServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddSwaggerServices(configuration);

        services.AddControllers(options =>
            {
                options.ModelBinderProviders.Insert(0, new DateOnlyModelBinderProvider());
            })
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
                options.JsonSerializerOptions.ReferenceHandler =
                    System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                options.JsonSerializerOptions.Converters.Add(new DateOnlyJsonConverter());
                options.JsonSerializerOptions.Converters.Add(
                    new System.Text.Json.Serialization.JsonStringEnumConverter());
            });
        services.AddResponseCaching();
        services.AddHttpContextAccessor();
        services.AddProblemDetails();
        services.AddExceptionHandler<CustomExceptionHandler>();

        services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(
            options => options.SuppressModelStateInvalidFilter = true);

        services.AddMonitoringServices(configuration);
        services.AddRateLimiterServices(configuration);
        services.AddResponseCompressionServices();
        services.AddResponseCompressionServices();

        var redisConnectionString = configuration["Redis:ConnectionString"];
        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            services.AddDataProtection().SetApplicationName("panthora")
            .PersistKeysToStackExchangeRedis(
                StackExchange.Redis.ConnectionMultiplexer.Connect(redisConnectionString),
                "panthora-dp-keys");
        }

        services.AddSingleton<Contracts.Interfaces.IUser, ApiPublic.Infrastructure.CurrentUser>();
        services.AddSingleton<Contracts.Interfaces.IToken, ApiPublic.Infrastructure.CurrentToken>();
        services.AddScoped<Application.Services.IPaymentNotificationBroadcaster, ApiPublic.Infrastructure.NoOpPaymentNotificationBroadcaster>();
        services.AddScoped<Application.Services.ITourInstanceNotificationBroadcaster, ApiPublic.Infrastructure.NoOpTourInstanceNotificationBroadcaster>();

        return services;
    }

    #region Swagger

    private static IServiceCollection AddSwaggerServices(
        this IServiceCollection services,
        IConfiguration cfg)
    {
        var serviceName = cfg["AppConfig:ServiceName"] ?? "Public API";
        var title = cfg["SwaggerGen:Title"] ?? serviceName;
        var version = cfg["SwaggerGen:Version"] ?? "v1";
        var description = cfg["SwaggerGen:Description"] ?? $"API for {serviceName}";
        var contactName = cfg["SwaggerGen:ContactName"];
        var contactEmail = cfg["SwaggerGen:ContactEmail"];
        var contactUrl = cfg["SwaggerGen:ContactUrl"];

        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer((document, _, _) =>
            {
                document.Info = new OpenApiInfo
                {
                    Title = title,
                    Version = version,
                    Description = description,
                    Contact = new OpenApiContact
                    {
                        Name = contactName,
                        Email = contactEmail,
                        Url = !string.IsNullOrEmpty(contactUrl)
                            ? new Uri(contactUrl)
                            : null
                    }
                };

                // No Bearer security scheme — this is a public API
                document.SetReferenceHostDocument();
                return Task.CompletedTask;
            });
        });

        return services;
    }

    public static WebApplication UseSwaggerApi(this WebApplication app)
    {
        var serviceName = app.Configuration["AppConfig:ServiceName"] ?? "Public API";

        app.MapOpenApi();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/openapi/v1.json", $"{serviceName} v1");
            options.RoutePrefix = "swagger";
            options.DocumentTitle = serviceName;
        });

        app.MapGet("/", () => Results.Redirect("/swagger", false));

        return app;
    }

    #endregion

    #region Middleware pipeline

    public static WebApplication UsePublicApiMiddleware(this WebApplication app)
    {
        var forwardedOptions = new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor
                             | ForwardedHeaders.XForwardedProto
                             | ForwardedHeaders.XForwardedHost
        };
        forwardedOptions.KnownIPNetworks.Clear();
        forwardedOptions.KnownProxies.Clear();
        forwardedOptions.KnownIPNetworks.Add(System.Net.IPNetwork.Parse("0.0.0.0/0"));
        forwardedOptions.KnownIPNetworks.Add(System.Net.IPNetwork.Parse("::/0"));
        app.UseForwardedHeaders(forwardedOptions);

        app.UseMiddleware<ExceptionHandlingMiddleware>();

        app.UseCors("DefaultCorsPolicy");

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseResponseCompression();
        app.UseResponseCaching();

        app.UseMiddleware<LanguageResolutionMiddleware>();
        app.UseMiddleware<SecurityHeadersMiddleware>();

        app.UseRateLimiter();
        app.UseSerilogRequestLogging();

        app.UseSwaggerApi();

        app.MapHealthChecks("/health").AllowAnonymous();
        app.MapHealthChecks("/health/live", new()
        {
            Predicate = check => check.Name == "self"
        }).AllowAnonymous();
        app.MapHealthChecks("/health/ready", new()
        {
            Predicate = check => check.Name == "database"
        }).AllowAnonymous();

        return app;
    }

    public static WebApplicationBuilder AddCorsPolicy(this WebApplicationBuilder builder)
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("DefaultCorsPolicy", policy =>
            {
                policy.WithOrigins(allowedOrigins ?? [])
                      .SetIsOriginAllowedToAllowWildcardSubdomains()
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            });
        });

        return builder;
    }

    public static WebApplicationBuilder AddHealthChecks(this WebApplicationBuilder builder)
    {
        builder.Services.AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy("Public API is running"))
            .AddCheck<DatabaseHealthCheck>("database");

        return builder;
    }

    #endregion

    #region Rate Limiting

    private static IServiceCollection AddRateLimiterServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var rateLimitSection = configuration.GetSection("RateLimit");
        var globalPermitLimit = rateLimitSection.GetValue("GlobalPermitLimit", 100);
        var authPermitLimit = rateLimitSection.GetValue("AuthPermitLimit", 10);
        var windowSeconds = rateLimitSection.GetValue("WindowSeconds", 60);

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy("auth-strict", context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = authPermitLimit,
                        Window = TimeSpan.FromSeconds(windowSeconds),
                        QueueLimit = 0
                    }));

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = globalPermitLimit,
                        Window = TimeSpan.FromSeconds(windowSeconds),
                        QueueLimit = 0
                    }));
        });

        return services;
    }

    #endregion

    #region Monitoring

    private static IServiceCollection AddMonitoringServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        using var listener = new ActivityListener();
        listener.ShouldListenTo = _ => true;
        listener.Sample = (ref _) => ActivitySamplingResult.AllData;
        ActivitySource.AddActivityListener(listener);

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

        return services;
    }

    #endregion

    #region Response Compression

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

    #endregion
}
