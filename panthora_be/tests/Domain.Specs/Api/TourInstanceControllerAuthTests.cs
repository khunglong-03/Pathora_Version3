using global::Api.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Net;
using System.Reflection;

namespace Domain.Specs.Api;

public sealed class TourInstanceControllerAuthTests
{
    [Fact]
    public void GetAll_ShouldRequireAuthorizationAndNotAllowAnonymous()
    {
        var method = typeof(TourInstanceController).GetMethod(nameof(TourInstanceController.GetAll));

        Assert.NotNull(method);
        Assert.Empty(method!.GetCustomAttributes<AllowAnonymousAttribute>(inherit: true));
        Assert.NotEmpty(method.GetCustomAttributes<AuthorizeAttribute>(inherit: true));
    }

    [Fact]
    public async Task GetAll_WhenAnonymous_ShouldReturnUnauthorized()
    {
        using var host = await BuildHost();
        var client = host.GetTestClient();

        var response = await client.GetAsync("/api/tour-instance");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.DoesNotContain("items", body, StringComparison.OrdinalIgnoreCase);
    }

    private static async Task<IHost> BuildHost()
    {
        var hostBuilder = new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.ConfigureServices(services =>
                {
                    services
                        .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
                        .AddCookie(options =>
                        {
                            options.Events.OnRedirectToLogin = context =>
                            {
                                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                                return Task.CompletedTask;
                            };
                        });

                    services.AddAuthorization();
                    services
                        .AddControllers()
                        .AddApplicationPart(typeof(TourInstanceController).Assembly);
                });

                webBuilder.Configure(app =>
                {
                    app.UseRouting();
                    app.UseAuthentication();
                    app.UseAuthorization();
                    app.UseEndpoints(endpoints => endpoints.MapControllers());
                });
            });

        return await hostBuilder.StartAsync();
    }
}
