using Application.Common.Constant;
using Contracts.Interfaces;

namespace Api.Middleware;

public sealed class LanguageResolutionMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> SupportedLanguages =
        [.. SupportedLanguageConstants.All];

    public async Task InvokeAsync(HttpContext context, ILanguageContext languageContext)
    {
        var requestedLanguage = context.Request.Query["lang"].FirstOrDefault();
        var headerLanguage = context.Request.Headers.AcceptLanguage.FirstOrDefault();

        languageContext.CurrentLanguage = ResolveLanguage(requestedLanguage, headerLanguage);

        // If Accept-Language header is used (no ?lang=), embed it into the request path
        // so ResponseCache middleware varies the cache key by language header.
        if (string.IsNullOrWhiteSpace(requestedLanguage) && !string.IsNullOrWhiteSpace(headerLanguage))
        {
            var normalizedHeader = NormalizeLanguage(headerLanguage);
            if (normalizedHeader is not null)
            {
                // Embed language into query so cache key includes it
                var queryPart = context.Request.QueryString.HasValue
                    ? $"{context.Request.QueryString.Value}&lang={normalizedHeader}"
                    : $"?lang={normalizedHeader}";
                context.Request.QueryString = new QueryString(queryPart);
            }
        }

        await next(context);
    }

    private static string ResolveLanguage(string? queryLanguage, string? acceptLanguageHeader)
    {
        var normalizedFromQuery = NormalizeLanguage(queryLanguage);
        if (normalizedFromQuery is not null)
        {
            return normalizedFromQuery;
        }

        var normalizedFromHeader = NormalizeLanguage(acceptLanguageHeader);
        if (normalizedFromHeader is not null)
        {
            return normalizedFromHeader;
        }

        return ILanguageContext.DefaultLanguage;
    }

    private static string? NormalizeLanguage(string? language)
    {
        if (string.IsNullOrWhiteSpace(language))
        {
            return null;
        }

        var firstToken = language.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault();
        var languageValue = firstToken ?? language;
        var qualityTrimmed = languageValue.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault() ?? languageValue;
        var normalizedLanguage = qualityTrimmed.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault() ?? qualityTrimmed;
        var languageCode = normalizedLanguage.ToLowerInvariant();

        return SupportedLanguages.Contains(languageCode)
            ? languageCode
            : null;
    }
}
