namespace Common.Authentication;

public static class AuthTokenResolver
{
    public static string? Resolve(string? authorizationHeader, string? accessTokenCookie)
    {
        var authorization = authorizationHeader ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(authorization) &&
            authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return authorization["Bearer ".Length..].Trim();
        }

        return accessTokenCookie;
    }
}
