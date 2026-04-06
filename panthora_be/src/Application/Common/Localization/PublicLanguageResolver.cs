using Application.Common.Constant;
using Contracts.Interfaces;

namespace Application.Common.Localization;

public static class PublicLanguageResolver
{
    private static readonly HashSet<string> SupportedLanguages =
        [.. SupportedLanguageConstants.All];

    public static string Resolve(string? language)
    {
        if (string.IsNullOrWhiteSpace(language))
        {
            return ILanguageContext.DefaultLanguage;
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
            : ILanguageContext.DefaultLanguage;
    }
}
