using Common.Authentication;
using System.Security.Claims;
using Contracts.Interfaces;

namespace Api.Infrastructure;

public class CurrentToken(IHttpContextAccessor httpContextAccessor) : IToken
{
    public string? Id => httpContextAccessor.HttpContext?.User.FindFirstValue("jti");
    public string? Token => httpContextAccessor.HttpContext is null
        ? null
        : AuthTokenResolver.Resolve(
            httpContextAccessor.HttpContext.Request.Headers.Authorization.ToString(),
            httpContextAccessor.HttpContext.Request.Cookies["access_token"]);
    public string? Expire => httpContextAccessor.HttpContext?.User.FindFirstValue("exp");
}

