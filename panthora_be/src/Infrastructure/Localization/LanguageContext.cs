using Contracts.Interfaces;

namespace Infrastructure.Localization;

public sealed class LanguageContext : ILanguageContext
{
    public string CurrentLanguage { get; set; } = ILanguageContext.DefaultLanguage;
}
