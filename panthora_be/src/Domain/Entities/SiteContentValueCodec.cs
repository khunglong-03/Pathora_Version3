using System.Text;
using System.Text.Json;

namespace Domain.Entities;

public readonly record struct SiteContentValueMetadata(
    bool IsLocalized,
    bool HasEnglish,
    bool HasVietnamese);

public readonly record struct SiteContentEditableValues(
    string EnglishContentValue,
    string VietnameseContentValue,
    bool IsLocalized,
    bool HasEnglish,
    bool HasVietnamese);

public static class SiteContentValueCodec
{
    public const string EnglishLanguage = "en";
    public const string VietnameseLanguage = "vi";

    public static JsonElement ResolveContentElement(string contentValue, string? language)
    {
        if (!TryParseRoot(contentValue, out var root))
        {
            return CreateStringElement(contentValue);
        }

        var normalizedLanguage = NormalizeLanguage(language);

        if (TryResolveLocalizedElement(root, normalizedLanguage, out var requested))
        {
            return requested;
        }

        if (TryResolveLocalizedElement(root, EnglishLanguage, out var english))
        {
            return english;
        }

        return root;
    }

    public static SiteContentValueMetadata GetMetadata(string contentValue)
    {
        if (!TryParseRoot(contentValue, out var root))
        {
            return new SiteContentValueMetadata(false, false, false);
        }

        var hasEnglish = TryGetPropertyIgnoreCase(root, EnglishLanguage, out _);
        var hasVietnamese = TryGetPropertyIgnoreCase(root, VietnameseLanguage, out _);
        var isLocalized = root.ValueKind == JsonValueKind.Object && (hasEnglish || hasVietnamese);

        return new SiteContentValueMetadata(isLocalized, hasEnglish, hasVietnamese);
    }

    public static SiteContentEditableValues GetEditableValues(string contentValue)
    {
        if (!TryParseRoot(contentValue, out var root))
        {
            return new SiteContentEditableValues(
                contentValue,
                contentValue,
                false,
                false,
                false);
        }

        var hasEnglish = TryGetPropertyIgnoreCase(root, EnglishLanguage, out var englishValue);
        var hasVietnamese = TryGetPropertyIgnoreCase(root, VietnameseLanguage, out var vietnameseValue);
        var isLocalized = root.ValueKind == JsonValueKind.Object && (hasEnglish || hasVietnamese);

        if (!isLocalized)
        {
            var legacy = root.GetRawText();
            return new SiteContentEditableValues(legacy, legacy, false, false, false);
        }

        var fallback = root.GetRawText();
        var english = hasEnglish ? englishValue.GetRawText() : fallback;
        var vietnamese = hasVietnamese ? vietnameseValue.GetRawText() : fallback;

        return new SiteContentEditableValues(
            english,
            vietnamese,
            true,
            hasEnglish,
            hasVietnamese);
    }

    public static bool TryCreateLocalizedContentValue(
        string englishContentValue,
        string vietnameseContentValue,
        out string localizedContentValue,
        out string? error)
    {
        localizedContentValue = string.Empty;

        if (string.IsNullOrWhiteSpace(englishContentValue))
        {
            error = "englishContentValue is required";
            return false;
        }

        if (string.IsNullOrWhiteSpace(vietnameseContentValue))
        {
            error = "vietnameseContentValue is required";
            return false;
        }

        if (!TryParseRoot(englishContentValue, out var englishRoot))
        {
            error = "englishContentValue must be valid JSON";
            return false;
        }

        if (!TryParseRoot(vietnameseContentValue, out var vietnameseRoot))
        {
            error = "vietnameseContentValue must be valid JSON";
            return false;
        }

        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream))
        {
            writer.WriteStartObject();
            writer.WritePropertyName(EnglishLanguage);
            englishRoot.WriteTo(writer);
            writer.WritePropertyName(VietnameseLanguage);
            vietnameseRoot.WriteTo(writer);
            writer.WriteEndObject();
        }

        localizedContentValue = Encoding.UTF8.GetString(stream.ToArray());
        error = null;
        return true;
    }

    public static bool TryNormalizeJson(string contentValue, out string normalizedContentValue)
    {
        if (!TryParseRoot(contentValue, out var root))
        {
            normalizedContentValue = string.Empty;
            return false;
        }

        normalizedContentValue = root.GetRawText();
        return true;
    }

    private static bool TryResolveLocalizedElement(JsonElement root, string language, out JsonElement resolved)
    {
        resolved = default;

        if (root.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        if (!TryGetPropertyIgnoreCase(root, language, out var candidate))
        {
            return false;
        }

        resolved = candidate;
        return true;
    }

    private static bool TryParseRoot(string contentValue, out JsonElement root)
    {
        try
        {
            using var document = JsonDocument.Parse(contentValue);
            root = document.RootElement.Clone();
            return true;
        }
        catch (JsonException)
        {
            root = default;
            return false;
        }
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement root, string propertyName, out JsonElement value)
    {
        value = default;

        if (root.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        if (root.TryGetProperty(propertyName, out value))
        {
            return true;
        }

        foreach (var property in root.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        return false;
    }

    private static string NormalizeLanguage(string? language)
    {
        if (string.IsNullOrWhiteSpace(language))
        {
            return EnglishLanguage;
        }

        var firstToken = language.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault();
        var languageValue = firstToken ?? language;
        var normalized = languageValue.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault() ?? languageValue;
        var languageCode = normalized.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault() ?? normalized;

        return languageCode.ToLowerInvariant();
    }

    private static JsonElement CreateStringElement(string value)
    {
        using var document = JsonDocument.Parse(JsonSerializer.Serialize(value));
        return document.RootElement.Clone();
    }
}
