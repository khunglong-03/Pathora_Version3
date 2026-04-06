using Application.Contracts.Identity;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace Api.Infrastructure;

public static class AuthCookieWriter
{
    private const string AccessTokenCookieName = "access_token";
    private const string RefreshTokenCookieName = "refresh_token";
    private const string AuthStatusCookieName = "auth_status";
    private const string AuthPortalCookieName = "auth_portal";

    public static void WriteAuthCookies(HttpResponse response, ExternalLoginResponse tokens, bool secure, JwtOptions jwtOptions)
    {
        var accessTokenLifetime = TimeSpan.FromHours(jwtOptions.AccessTokenCookieExpirationHours);
        var refreshTokenLifetime = TimeSpan.FromHours(jwtOptions.RefreshTokenExpirationHours);
        response.Cookies.Append(AccessTokenCookieName, tokens.AccessToken, BuildAccessTokenOptions(accessTokenLifetime, secure));
        response.Cookies.Append(RefreshTokenCookieName, tokens.RefreshToken, BuildOptions(refreshTokenLifetime, secure));
        WriteAuthStatusCookie(response, secure);
        WriteAuthPortalCookie(response, tokens.Portal, secure);
    }

    public static void WriteAuthCookies(HttpResponse response, LoginResponse tokens, bool secure, JwtOptions jwtOptions)
    {
        var accessTokenLifetime = TimeSpan.FromHours(jwtOptions.AccessTokenCookieExpirationHours);
        var refreshTokenLifetime = TimeSpan.FromHours(jwtOptions.RefreshTokenExpirationHours);
        response.Cookies.Append(AccessTokenCookieName, tokens.AccessToken, BuildAccessTokenOptions(accessTokenLifetime, secure));
        response.Cookies.Append(RefreshTokenCookieName, tokens.RefreshToken, BuildOptions(refreshTokenLifetime, secure));
        WriteAuthStatusCookie(response, secure);
        WriteAuthPortalCookie(response, tokens.Portal, secure);
    }

    public static void WriteRefreshCookies(HttpResponse response, string accessToken, string refreshToken, bool secure, JwtOptions jwtOptions)
    {
        var accessTokenLifetime = TimeSpan.FromHours(jwtOptions.AccessTokenCookieExpirationHours);
        var refreshTokenLifetime = TimeSpan.FromHours(jwtOptions.RefreshTokenExpirationHours);
        response.Cookies.Append(AccessTokenCookieName, accessToken, BuildAccessTokenOptions(accessTokenLifetime, secure));
        response.Cookies.Append(RefreshTokenCookieName, refreshToken, BuildOptions(refreshTokenLifetime, secure));
    }

    public static void WriteAuthStatusCookie(HttpResponse response, bool secure)
    {
        // auth_status lifetime matches refresh token lifetime
        response.Cookies.Append(AuthStatusCookieName, "1", BuildOptions(TimeSpan.FromHours(168), secure));
    }

    public static void ClearAuthCookies(HttpResponse response, bool secure)
    {
        response.Cookies.Delete(AccessTokenCookieName, BuildOptions(TimeSpan.Zero, secure));
        response.Cookies.Delete(RefreshTokenCookieName, BuildOptions(TimeSpan.Zero, secure));
        ClearAuthStatusCookie(response, secure);
        ClearAuthPortalCookie(response, secure);
    }

    public static void ClearAuthStatusCookie(HttpResponse response, bool secure)
    {
        response.Cookies.Delete(AuthStatusCookieName, BuildOptions(TimeSpan.Zero, secure));
    }

    public static void WriteAuthPortalCookie(HttpResponse response, string? portal, bool secure)
    {
        // auth_portal lifetime matches refresh token lifetime
        response.Cookies.Append(AuthPortalCookieName, NormalizePortal(portal), BuildOptions(TimeSpan.FromHours(168), secure));
    }

    public static void ClearAuthPortalCookie(HttpResponse response, bool secure)
    {
        response.Cookies.Delete(AuthPortalCookieName, BuildOptions(TimeSpan.Zero, secure));
    }

    private static CookieOptions BuildOptions(TimeSpan maxAge, bool secure)
    {
        return new CookieOptions
        {
            HttpOnly = true,
            IsEssential = true,
            MaxAge = maxAge,
            Path = "/",
            SameSite = SameSiteMode.Lax,
            Secure = secure
        };
    }

    /// <summary>
    /// Builds CookieOptions for the access token — intentionally HttpOnly=false
    /// so that frontend JavaScript can read it and set Authorization headers.
    /// The refresh token remains HttpOnly for security (XSS cannot steal it).
    /// </summary>
    private static CookieOptions BuildAccessTokenOptions(TimeSpan maxAge, bool secure)
    {
        return new CookieOptions
        {
            HttpOnly = false, // <-- JS-readable so frontend can read for Authorization header
            IsEssential = true,
            MaxAge = maxAge,
            Path = "/",
            SameSite = SameSiteMode.Lax,
            Secure = secure
        };
    }

    private static string NormalizePortal(string? portal)
    {
        return string.Equals(portal, "admin", StringComparison.OrdinalIgnoreCase)
            ? "admin"
            : "user";
    }
}
