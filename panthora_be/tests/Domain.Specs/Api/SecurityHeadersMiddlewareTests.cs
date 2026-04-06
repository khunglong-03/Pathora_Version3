using Api.Middleware;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

namespace Domain.Specs.Api;

/// <summary>
/// Unit tests for SecurityHeadersMiddleware.
/// </summary>
public sealed class SecurityHeadersMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WhenResponseNotStarted_ShouldWriteSecurityHeaders()
    {
        // Arrange
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };
        var middleware = new SecurityHeadersMiddleware(next);
        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = CreateHostingEnv("Production");

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.True(nextCalled);
        Assert.Equal("nosniff", httpContext.Response.Headers["X-Content-Type-Options"].ToString());
        Assert.Equal("DENY", httpContext.Response.Headers["X-Frame-Options"].ToString());
        Assert.Equal("0", httpContext.Response.Headers["X-XSS-Protection"].ToString());
        Assert.Equal("strict-origin-when-cross-origin", httpContext.Response.Headers["Referrer-Policy"].ToString());
    }

    [Fact]
    public async Task InvokeAsync_WhenResponseHasStarted_ShouldSkipHeadersAndCallNext()
    {
        // Arrange
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };
        var middleware = new SecurityHeadersMiddleware(next);
        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = CreateHostingEnv("Production");

        // Simulate response already started (e.g. challenge written by auth middleware)
        httpContext.Response.StatusCode = 401;
        var responseFeature = new StartedHttpResponseFeature();
        httpContext.Features.Set<IHttpResponseFeature>(responseFeature);

        Assert.True(httpContext.Response.HasStarted);

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.True(nextCalled);
        // No security headers should be added after response started
        Assert.False(httpContext.Response.Headers.ContainsKey("X-Content-Type-Options"));
    }

    [Fact]
    public async Task InvokeAsync_WhenResponseNotStarted_InDevelopment_ShouldNotWriteHstsHeader()
    {
        // Arrange
        RequestDelegate next = _ => Task.CompletedTask;
        var middleware = new SecurityHeadersMiddleware(next);
        var httpContext = new DefaultHttpContext();
        httpContext.RequestServices = CreateHostingEnv("Development");

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.False(httpContext.Response.Headers.ContainsKey("Strict-Transport-Security"));
    }

    private static IServiceProvider CreateHostingEnv(string environment)
    {
        var services = new ServiceCollection();
        services.AddSingleton<IWebHostEnvironment>(new StubWebHostEnvironment(environment));
        return services.BuildServiceProvider();
    }

    private sealed class StubWebHostEnvironment : IWebHostEnvironment
    {
        public StubWebHostEnvironment(string env) => EnvironmentName = env;

        public string EnvironmentName { get; set; }
        public string ApplicationName { get; set; } = "Test";
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = string.Empty;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class StartedHttpResponseFeature : IHttpResponseFeature
    {
        public int StatusCode { get; set; } = StatusCodes.Status200OK;
        public string? ReasonPhrase { get; set; }
        public IHeaderDictionary Headers { get; set; } = new HeaderDictionary();
        public Stream Body { get; set; } = new MemoryStream();
        public bool HasStarted { get; set; } = true;
        public void OnStarting(Func<object, Task> callback, object state) { }
        public void OnCompleted(Func<object, Task> callback, object state) { }
    }
}
