using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Api.Middleware;

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
            // Suppress: this exception is thrown by JwtBearerHandler.HandleChallengeAsync when it
            // tries to set StatusCode after our OnChallenge callback already started the response.
            // Since the response is already in flight with a correct status code, we just log and
            // suppress the exception to prevent it from bubbling up as an unhandled error.
            logger.LogDebug(
                "Suppressed 'response already started' exception during auth challenge. " +
                "Response status: {StatusCode}",
                context.Response.StatusCode);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Headers are read-only"))
        {
            // TEMPORARY DIAGNOSTIC: catch "Headers are read-only" variant from OAuthHandler.GenerateCorrelationId
            Console.WriteLine($"[DIAG-EXC] InvalidOperationException caught by ExceptionHandlingMiddleware: {ex.Message}");
            Console.WriteLine($"[DIAG-EXC] HasStarted: {context.Response.HasStarted}, Status: {context.Response.StatusCode}");
            Console.WriteLine($"[DIAG-EXC] Path: {context.Request.Path}");
            Console.WriteLine($"[DIAG-EXC] Headers: {string.Join(", ", context.Response.Headers.Select(h => $"{h.Key}={h.Value.ToString()}"))}");
            throw; // Rethrow to see the original exception
        }
    }
}
