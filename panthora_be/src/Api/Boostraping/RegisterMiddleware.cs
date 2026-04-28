using Microsoft.AspNetCore.HttpOverrides;
using Serilog;

namespace Api.Bosttraping;

public static class RegisterMiddleware
{
    public static WebApplicationBuilder ConfigurePipeline(this WebApplicationBuilder builder)
    {
        return builder;
    }

    public static WebApplication UseAppMiddleware(this WebApplication app)
    {
        var forwardedOptions = new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost
        };
        forwardedOptions.KnownIPNetworks.Clear();
        forwardedOptions.KnownProxies.Clear();
        app.UseForwardedHeaders(forwardedOptions);

        app.UseMiddleware<StartupCacheClearMiddleware>();
        app.UseMiddleware<SwaggerAuthBypassMiddleware>();
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
            .AddCheck("self", () => HealthCheckResult.Healthy("API is running"))
            .AddCheck<DatabaseHealthCheck>("database");

        return builder;
    }
}
