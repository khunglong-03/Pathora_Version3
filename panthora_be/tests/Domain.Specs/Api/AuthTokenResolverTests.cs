using Common.Authentication;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class AuthTokenResolverTests
{
    [Fact]
    public void Resolve_ShouldReturnBearerTokenFromAuthorizationHeader()
    {
        var result = AuthTokenResolver.Resolve("Bearer header-token", null);

        Assert.Equal("header-token", result);
    }

    [Fact]
    public void Resolve_ShouldFallbackToAccessTokenCookie()
    {
        var result = AuthTokenResolver.Resolve(null, "cookie-token");

        Assert.Equal("cookie-token", result);
    }
}
