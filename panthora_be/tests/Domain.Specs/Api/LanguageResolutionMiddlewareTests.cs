using Api.Middleware;
using Contracts.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class LanguageResolutionMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_ShouldPrioritizeQueryLangOverHeader()
    {
        var middleware = new LanguageResolutionMiddleware(_ => Task.CompletedTask);
        var languageContext = new TestLanguageContext();
        var httpContext = new DefaultHttpContext();
        httpContext.Request.QueryString = new QueryString("?lang=en");
        httpContext.Request.Headers.Append("Accept-Language", "vi");

        await middleware.InvokeAsync(httpContext, languageContext);

        Assert.Equal("en", languageContext.CurrentLanguage);
    }

    [Fact]
    public async Task InvokeAsync_ShouldUseHeaderWhenQueryMissing()
    {
        var middleware = new LanguageResolutionMiddleware(_ => Task.CompletedTask);
        var languageContext = new TestLanguageContext();
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers.Append("Accept-Language", "en-US,en;q=0.9");

        await middleware.InvokeAsync(httpContext, languageContext);

        Assert.Equal("en", languageContext.CurrentLanguage);
    }

    [Fact]
    public async Task InvokeAsync_ShouldResolveVietnameseFromHeaderWithRegionAndQuality()
    {
        var middleware = new LanguageResolutionMiddleware(_ => Task.CompletedTask);
        var languageContext = new TestLanguageContext();
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers.Append("Accept-Language", "vi-VN,vi;q=0.9,en;q=0.8");

        await middleware.InvokeAsync(httpContext, languageContext);

        Assert.Equal("vi", languageContext.CurrentLanguage);
    }

    [Fact]
    public async Task InvokeAsync_ShouldFallbackToHeaderWhenQueryLanguageUnsupported()
    {
        var middleware = new LanguageResolutionMiddleware(_ => Task.CompletedTask);
        var languageContext = new TestLanguageContext();
        var httpContext = new DefaultHttpContext();
        httpContext.Request.QueryString = new QueryString("?lang=fr-CA");
        httpContext.Request.Headers.Append("Accept-Language", "vi");

        await middleware.InvokeAsync(httpContext, languageContext);

        Assert.Equal("vi", languageContext.CurrentLanguage);
    }

    [Fact]
    public async Task InvokeAsync_ShouldFallbackToDefaultWhenQueryAndHeaderMissing()
    {
        var middleware = new LanguageResolutionMiddleware(_ => Task.CompletedTask);
        var languageContext = new TestLanguageContext();
        var httpContext = new DefaultHttpContext();

        await middleware.InvokeAsync(httpContext, languageContext);

        Assert.Equal(ILanguageContext.DefaultLanguage, languageContext.CurrentLanguage);
    }

    [Fact]
    public async Task InvokeAsync_ShouldFallbackToDefaultWhenLanguageUnsupported()
    {
        var middleware = new LanguageResolutionMiddleware(_ => Task.CompletedTask);
        var languageContext = new TestLanguageContext();
        var httpContext = new DefaultHttpContext();
        httpContext.Request.QueryString = new QueryString("?lang=fr");

        await middleware.InvokeAsync(httpContext, languageContext);

        Assert.Equal(ILanguageContext.DefaultLanguage, languageContext.CurrentLanguage);
    }

    private sealed class TestLanguageContext : ILanguageContext
    {
        public string CurrentLanguage { get; set; } = ILanguageContext.DefaultLanguage;
    }
}
