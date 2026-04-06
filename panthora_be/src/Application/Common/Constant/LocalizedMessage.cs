using System.Globalization;

namespace Application.Common.Constant;

public sealed record LocalizedMessage(string Vi, string En)
{
    public string Resolve(string? lang)
    {
        return string.Equals(lang, "vi", StringComparison.OrdinalIgnoreCase) ? Vi : En;
    }

    public string Format(string? lang, params object?[] args)
    {
        return string.Format(CultureInfo.InvariantCulture, Resolve(lang), args);
    }

    public static implicit operator string(LocalizedMessage message)
    {
        return message.Vi;
    }

    public override string ToString()
    {
        return Vi;
    }
}
