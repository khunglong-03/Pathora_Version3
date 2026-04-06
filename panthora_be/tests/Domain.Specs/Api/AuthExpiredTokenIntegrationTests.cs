using Api;
using Api.Middleware;
using Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;

namespace Domain.Specs.Api;

/// <summary>
/// Integration-style test using TestServer to validate expired token behavior.
/// Ensures expired JWT returns 401 and does not trigger response-started cascade to 500.
/// </summary>
public sealed class AuthExpiredTokenIntegrationTests
{
    [Fact]
    public async Task ProtectedEndpoint_WithExpiredToken_ShouldReturn401AndNot500()
    {
        var jwtSecret = "this-is-a-very-long-test-secret-key-1234567890";
        using var host = await BuildTestHost(jwtSecret);
        var client = host.GetTestClient();

        var expiredToken = CreateExpiredJwt(jwtSecret);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expiredToken);

        var response = await client.GetAsync("/protected");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.DoesNotContain("InvalidOperationException", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("StatusCode cannot be set because the response has already started", body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("TOKEN_EXPIRED", body, StringComparison.OrdinalIgnoreCase);
    }

    private static async Task<IHost> BuildTestHost(string jwtSecret)
    {
        var hostBuilder = new HostBuilder()
            .ConfigureAppConfiguration(cfg =>
            {
                cfg.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Jwt:Secret"] = jwtSecret,
                    ["Jwt:Issuer"] = "test-issuer",
                    ["Jwt:Audience"] = "test-audience",
                    ["AppConfig:IncludeInnerException"] = "true",
                    ["AppConfig:IncludeExceptionStackTrace"] = "true"
                });
            })
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.ConfigureServices((context, services) =>
                {
                    services.AddInfrastructureServices(context.Configuration);
                    services.AddApiServices(context.Configuration);
                    services.AddRouting();
                });

                webBuilder.Configure(app =>
                {
                    app.UseExceptionHandler();
                    app.UseMiddleware<LanguageResolutionMiddleware>();
                    app.UseMiddleware<SecurityHeadersMiddleware>();
                    app.UseRouting();
                    app.UseAuthentication();
                    app.UseAuthorization();

                    app.UseEndpoints(endpoints =>
                    {
                        endpoints.MapGet("/protected", async context =>
                        {
                            context.Response.StatusCode = StatusCodes.Status200OK;
                            await context.Response.WriteAsJsonAsync(new { ok = true });
                        }).RequireAuthorization();
                    });
                });
            });

        var host = await hostBuilder.StartAsync();
        return host;
    }

    private static string CreateExpiredJwt(string secret)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "test-issuer",
            audience: "test-audience",
            claims:
            [
                new Claim(ClaimTypes.NameIdentifier, "user-1"),
                new Claim("jti", Guid.NewGuid().ToString("N"))
            ],
            notBefore: DateTime.UtcNow.AddMinutes(-10),
            expires: DateTime.UtcNow.AddMinutes(-1),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
