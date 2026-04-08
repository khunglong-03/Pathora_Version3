using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Application.Common;
using Application.Common.Interfaces;
using Common.Authentication;
using Contracts.Interfaces;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using ZiggyCreatures.Caching.Fusion;

namespace Infrastructure.Identity;

internal static class DependencyInjection
{
    internal static IServiceCollection AddIdentityServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var authBuilder = services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            })
            .AddCookie(IdentityConstants.ExternalScheme)
            .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme);

        var googleClientId = configuration["Authentication:Google:ClientId"];
        var googleClientSecret = configuration["Authentication:Google:ClientSecret"];

        if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
        {
            authBuilder.AddGoogle(options =>
            {
                options.ClientId = googleClientId;
                options.ClientSecret = googleClientSecret;
                options.Scope.Add("email");
                options.Scope.Add("profile");
                options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            });
        }

        authBuilder.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                var jwtSecret = configuration["Jwt:Secret"];
                if (string.IsNullOrWhiteSpace(jwtSecret))
                {
                    throw new InvalidOperationException(
                        "Missing configuration value 'Jwt:Secret'. Set it in appsettings or environment variables.");
                }

                var validIssuers = BuildValidIssuers(configuration);
                var validAudiences = BuildValidAudiences(configuration, validIssuers);

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ClockSkew = TimeSpan.Zero,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                    ValidIssuers = validIssuers,
                    ValidAudiences = validAudiences,

                    NameClaimType = ClaimTypes.NameIdentifier,
                    RoleClaimType = ClaimTypes.Role
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var token = AuthTokenResolver.Resolve(
                            context.Request.Headers.Authorization.ToString(),
                            context.Request.Cookies["access_token"]);
                        if (!string.IsNullOrWhiteSpace(token))
                        {
                            context.Token = token;
                        }

                        return Task.CompletedTask;
                    },
                    OnTokenValidated = async context =>
                    {
                        var jti = context.Principal?.FindFirst("jti")?.Value;
                        var cache = context.HttpContext.RequestServices.GetRequiredService<IFusionCache>();

                        var value = await cache.GetOrDefaultAsync(
                            $"{CacheKey.AccessToken}:blacklisted:{jti}",
                            string.Empty);
                        if (!string.IsNullOrEmpty(value))
                        {
                            context.Fail("Token is blacklisted");
                        }
                    },
                    OnAuthenticationFailed = context =>
                    {
                        if (context.Exception is SecurityTokenExpiredException)
                        {
                            // Only write response if the pipeline hasn't started yet.
                            // This prevents "StatusCode cannot be set because the response has already started".
                            if (!context.Response.HasStarted)
                            {
                                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                                context.Response.ContentType = "application/json";
                                context.Response.WriteAsync(
                                    """{"code":"TOKEN_EXPIRED","message":"Token has expired. Please login again.","statusCode":401}""");
                                context.NoResult();
                            }
                        }

                        return Task.CompletedTask;
                    },
                    OnChallenge = context =>
                    {
                        // Guard: if the response has already started (e.g. from a previous callback
                        // or another middleware), suppress further handling to prevent the exception
                        // "StatusCode cannot be set because the response has already started".
                        if (context.Response.HasStarted)
                        {
                            context.HandleResponse();
                            return Task.CompletedTask;
                        }

                        try
                        {
                            // 403 Forbidden: user is authenticated but lacks the required role.
                            // This hits OnChallenge (not OnForbid) when AuthorizationMiddleware
                            // calls ChallengeAsync after ForbidAsync. Write the 403 response and
                            // call HandleResponse to suppress the default challenge behavior.
                            if (context.AuthenticateFailure is not null &&
                                context.AuthenticateFailure.GetType().Name is "RolesAuthorizationFailure" or "AuthorizationFailure")
                            {
                                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                                context.Response.ContentType = "application/json";
                                context.HandleResponse();
                                return context.Response.WriteAsync(
                                    """{"code":"ACCESS_DENIED","message":"You do not have permission to perform this action.","statusCode":403}""");
                            }

                            // 401 Unauthorized: no valid authentication token
                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            context.Response.ContentType = "application/json";

                            string challengeJson = context.AuthenticateFailure switch
                            {
                                SecurityTokenExpiredException => """{"code":"TOKEN_EXPIRED","message":"Token has expired. Please login again.","statusCode":401}""",
                                _ => string.IsNullOrEmpty(context.Request.Headers.Authorization.ToString())
                                    ? """{"code":"TOKEN_MISSING","message":"Authentication required. Please provide a valid token.","statusCode":401}"""
                                    : """{"code":"TOKEN_INVALID","message":"Authentication failed. Please check your credentials.","statusCode":401}"""
                            };

                            // HandleResponse() stops the pipeline so the controller doesn't run and
                            // can't try to write Set-Cookie headers to an already-started response.
                            context.HandleResponse();
                            return context.Response.WriteAsync(challengeJson);
                        }
                        catch (InvalidOperationException) when (context.Response.HasStarted)
                        {
                            // Suppress: the base HandleChallengeAsync may try to set StatusCode after
                            // our callback wrote. Since HasStarted is now true, swallow the exception.
                            context.HandleResponse();
                            return Task.CompletedTask;
                        }
                    }
                };
            });

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.Jwt));
        services.Configure<Application.Options.AuthOptions>(configuration.GetSection("Auth"));
        services.AddScoped<ITokenManager, TokenManager>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();

        return services;
    }

    private static string[] BuildValidIssuers(IConfiguration configuration)
    {
        var primaryIssuers = ParseCsv(configuration["Jwt:Issuer"]);
        var extraIssuers = configuration.GetSection("Jwt:ValidIssuers").Get<string[]>() ?? [];

        return [.. primaryIssuers.Concat(extraIssuers).Distinct(StringComparer.OrdinalIgnoreCase)];
    }

    private static string[] BuildValidAudiences(IConfiguration configuration, IEnumerable<string> validIssuers)
    {
        var primaryAudiences = ParseCsv(configuration["Jwt:Audience"]);
        var extraAudiences = configuration.GetSection("Jwt:ValidAudiences").Get<string[]>() ?? [];

        // Backward compatibility: accept audience values that historically matched issuer.
        return [.. primaryAudiences
            .Concat(extraAudiences)
            .Concat(validIssuers)
            .Distinct(StringComparer.OrdinalIgnoreCase)];
    }

    private static IEnumerable<string> ParseCsv(string? value) =>
        (value ?? string.Empty)
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Where(v => !string.IsNullOrWhiteSpace(v));
}
