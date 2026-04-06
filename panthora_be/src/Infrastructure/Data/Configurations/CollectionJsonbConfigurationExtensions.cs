using System.Text.Json;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

internal static class CollectionJsonbConfigurationExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public static PropertyBuilder<List<string>> ConfigureCollectionJsonb(
        this PropertyBuilder<List<string>> builder)
    {
        builder.HasColumnType("jsonb");
        builder.HasConversion(
            value => SerializeList(value),
            value => DeserializeList(value));

        builder.Metadata.SetValueComparer(
            new ValueComparer<List<string>>(
                (left, right) => SerializeList(left) == SerializeList(right),
                value => SerializeList(value).GetHashCode(StringComparison.Ordinal),
                value => DeserializeList(SerializeList(value))));

        return builder;
    }

    private static string SerializeList(List<string>? value)
    {
        return JsonSerializer.Serialize(value ?? [], JsonOptions);
    }

    private static List<string> DeserializeList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        return JsonSerializer.Deserialize<List<string>>(json, JsonOptions) ?? [];
    }
}
