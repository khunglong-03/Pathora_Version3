namespace Contracts.Interfaces;

public interface ILanguageContext
{
    const string DefaultLanguage = "vi";

    string CurrentLanguage { get; set; }
}
