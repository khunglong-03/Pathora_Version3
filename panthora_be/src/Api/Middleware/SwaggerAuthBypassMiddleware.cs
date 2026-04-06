namespace Api.Middleware;

public sealed class SwaggerAuthBypassMiddleware(RequestDelegate next)
{
    private static readonly string[] s_bypassPaths =
    [
        "/swagger",
        "/openapi",
        "/swagger/v1/swagger.json",
        "/swagger/index.html",
        "/"
    ];

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        // Short-circuit Swagger/OpenAPI routes — skip auth entirely
        if (IsSwaggerPath(path))
        {
            // Clear any stale auth cookies so JwtBearer doesn't try to validate them
            context.Request.Headers.Remove("Authorization");
            context.Request.Headers.Remove("X-Access-Token");
            context.Request.Headers.Remove("X-Refresh-Token");
            context.Request.Headers.Remove("access_token");
            context.Request.Headers.Remove("refresh_token");

            if (context.Request.Cookies.Count > 0)
            {
                foreach (var cookie in context.Request.Cookies.Keys.ToList())
                {
                    if (cookie is "access_token" or "auth_status" or "refresh_token")
                    {
                        context.Request.Headers["Cookie"] = context.Request.Headers["Cookie"]
                            .ToString().Replace($"{cookie}={context.Request.Cookies[cookie]}; ", "")
                                   .Replace($"{cookie}={context.Request.Cookies[cookie]}", "");
                    }
                }
            }

            await next(context);
            return;
        }

        await next(context);
    }

    private static bool IsSwaggerPath(string path)
    {
        if (string.IsNullOrEmpty(path))
            return false;

        foreach (var bypass in s_bypassPaths)
        {
            if (path.Equals(bypass, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (bypass != "/" &&
                path.StartsWith($"{bypass}/", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
