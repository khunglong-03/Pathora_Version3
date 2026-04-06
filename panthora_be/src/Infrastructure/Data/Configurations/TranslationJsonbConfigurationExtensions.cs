using System.Text.Json;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

internal static class TranslationJsonbConfigurationExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static PropertyBuilder<Dictionary<string, TTranslation>> ConfigureTranslationsJsonb<TTranslation>(
        this PropertyBuilder<Dictionary<string, TTranslation>> builder)
        where TTranslation : class
    {
        builder.HasColumnType("jsonb");
        builder.HasConversion(
            value => Serialize(value),
            value => Deserialize<TTranslation>(value));

        builder.Metadata.SetValueComparer(
            new ValueComparer<Dictionary<string, TTranslation>>(
                (left, right) => Serialize(left) == Serialize(right),
                value => Serialize(value).GetHashCode(StringComparison.Ordinal),
                value => Deserialize<TTranslation>(Serialize(value))));

        return builder;
    }

    private static string Serialize<TTranslation>(Dictionary<string, TTranslation>? value)
        where TTranslation : class
    {
        var dictionary = value is null
            ? new Dictionary<string, TTranslation>(StringComparer.OrdinalIgnoreCase)
            : new Dictionary<string, TTranslation>(value, StringComparer.OrdinalIgnoreCase);

        return JsonSerializer.Serialize(dictionary, JsonOptions);
    }

    private static Dictionary<string, TTranslation> Deserialize<TTranslation>(string? json)
        where TTranslation : class
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new Dictionary<string, TTranslation>(StringComparer.OrdinalIgnoreCase);
        }

        var dictionary = JsonSerializer.Deserialize<Dictionary<string, TTranslation>>(json, JsonOptions);
        if (dictionary is null)
        {
            return new Dictionary<string, TTranslation>(StringComparer.OrdinalIgnoreCase);
        }

        return new Dictionary<string, TTranslation>(dictionary, StringComparer.OrdinalIgnoreCase);
    }
}
