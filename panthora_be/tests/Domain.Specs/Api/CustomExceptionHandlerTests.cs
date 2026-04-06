using Api.Exceptions.Handler;
using Common.Constants;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Infrastructure.Loging;
using NSubstitute;

namespace Domain.Specs.Api;

public sealed class CustomExceptionHandlerTests
{
    [Fact]
    public async Task TryHandleAsync_WhenArgumentOutOfRangeException_ShouldReturnBadRequest()
    {
        var handler = BuildHandler(includeInnerException: true, includeStackTrace: false);
        var httpContext = CreateHttpContext();

        var handled = await handler.TryHandleAsync(
            httpContext,
            new ArgumentOutOfRangeException("price", "Invalid price."),
            CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(StatusCodes.Status400BadRequest, httpContext.Response.StatusCode);

        httpContext.Response.Body.Position = 0;
        using var reader = new StreamReader(httpContext.Response.Body);
        var responseBody = await reader.ReadToEndAsync();
        Assert.Contains(MessageCode.BadRequest, responseBody, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TryHandleAsync_WhenArgumentException_ShouldReturnBadRequest()
    {
        var handler = BuildHandler(includeInnerException: true, includeStackTrace: false);
        var httpContext = CreateHttpContext();

        var handled = await handler.TryHandleAsync(
            httpContext,
            new ArgumentException("Invalid time range.", "endTime"),
            CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(StatusCodes.Status400BadRequest, httpContext.Response.StatusCode);
    }

    [Fact]
    public async Task TryHandleAsync_WhenResponseHasStarted_ShouldNotWriteAgain()
    {
        var handler = BuildHandler(includeInnerException: true, includeStackTrace: false);
        var httpContext = CreateHttpContext();

        httpContext.Features.Set<IHttpResponseFeature>(new StartedHttpResponseFeature());

        Assert.True(httpContext.Response.HasStarted);

        var handled = await handler.TryHandleAsync(
            httpContext,
            new Exception("secondary exception"),
            CancellationToken.None);

        Assert.True(handled);
        Assert.True(httpContext.Response.HasStarted);
        // When HasStarted is true, the handler returns early without modifying the response,
        // so the status code remains at its initial value (200 by default).
        Assert.Equal(200, httpContext.Response.StatusCode);
    }

    private static CustomExceptionHandler BuildHandler(bool includeInnerException, bool includeStackTrace)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AppConfig:IncludeInnerException"] = includeInnerException.ToString(),
                ["AppConfig:IncludeExceptionStackTrace"] = includeStackTrace.ToString()
            })
            .Build();

        var logger = Substitute.For<ILogger<CustomExceptionHandler>>();
        var logQueue = new LogQueue();
        return new CustomExceptionHandler(logger, configuration, logQueue);
    }

    private static HttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/test";
        context.Response.Body = new MemoryStream();
        return context;
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
