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

        app.MapHealthChecks("/health");
        app.MapHealthChecks("/health/live", new()
        {
            Predicate = check => check.Name == "self"
        });
        app.MapHealthChecks("/health/ready", new()
        {
            Predicate = check => check.Name == "database"
        });

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
