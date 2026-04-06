using Api.Middleware;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class SwaggerAuthBypassMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WhenPathIsProtectedApiRoute_ShouldPreserveAuthorizationHeader()
    {
        // Arrange
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        var middleware = new SwaggerAuthBypassMiddleware(next);
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = "/api/auth/me";
        httpContext.Request.Headers.Authorization = "Bearer valid-token";

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.True(nextCalled);
        Assert.Equal("Bearer valid-token", httpContext.Request.Headers.Authorization.ToString());
    }

    [Fact]
    public async Task InvokeAsync_WhenPathIsSwaggerRoute_ShouldRemoveAuthorizationHeader()
    {
        // Arrange
        RequestDelegate next = _ => Task.CompletedTask;
        var middleware = new SwaggerAuthBypassMiddleware(next);
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = "/swagger/index.html";
        httpContext.Request.Headers.Authorization = "Bearer swagger-token";

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.Equal(string.Empty, httpContext.Request.Headers.Authorization.ToString());
    }
}
