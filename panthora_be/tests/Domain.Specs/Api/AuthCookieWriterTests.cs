using Api.Infrastructure;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class AuthCookieWriterTests
{
    [Theory]
    [InlineData("admin", "auth_portal=admin")]
    [InlineData("ADMIN", "auth_portal=admin")]
    [InlineData("user", "auth_portal=user")]
    [InlineData("unknown", "auth_portal=user")]
    [InlineData("", "auth_portal=user")]
    public void WriteAuthPortalCookie_WhenPortalProvided_ShouldNormalizePortal(string portal, string expectedCookieFragment)
    {
        var httpContext = new DefaultHttpContext();

        AuthCookieWriter.WriteAuthPortalCookie(httpContext.Response, portal, secure: false);

        var setCookie = httpContext.Response.Headers.SetCookie.ToString();
        Assert.Contains(expectedCookieFragment, setCookie);
    }
}
