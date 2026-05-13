namespace ApiPublic.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("StatusCode cannot be set because the response has already started"))
        {
            logger.LogDebug(
                "Suppressed 'response already started' exception. " +
                "Response status: {StatusCode}",
                context.Response.StatusCode);
        }
    }
}
