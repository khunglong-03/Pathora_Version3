using Api;
using Api.Boostraping;
using Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using System.Net;

namespace Domain.Specs.Api;

public sealed class SwaggerUiConfigurationTests
{
    [Fact]
    public async Task SwaggerUi_InDevelopment_ShouldLoadSuccessfully()
    {
        using var host = await BuildTestHost();
        var client = host.GetTestClient();

        var response = await client.GetAsync("/swagger/index.html");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.DoesNotContain("Unable to resolve service", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("ISwaggerProvider", body, StringComparison.OrdinalIgnoreCase);
    }

    private static async Task<WebApplication> BuildTestHost()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = Environments.Development
        });

        builder.WebHost.UseTestServer();
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["AppConfig:ServiceName"] = "Test API",
            ["OpenTelemetry:Endpoint"] = "http://localhost:4318"
        });

        builder.Services.AddInfrastructureServices(builder.Configuration);
        builder.Services.AddApiServices(builder.Configuration);
        builder.AddCorsPolicy();
        builder.AddHealthChecks();

        var app = builder.Build();
        app.UseAppMiddleware();
        await app.StartAsync();

        return app;
    }
}
