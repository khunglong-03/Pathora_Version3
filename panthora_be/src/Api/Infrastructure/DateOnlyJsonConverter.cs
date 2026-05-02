using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Api.Infrastructure;

public sealed class DateOnlyJsonConverter : JsonConverter<DateOnly>
{
    public override DateOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            var value = reader.GetString();
            if (string.IsNullOrEmpty(value))
                return default;

            if (DateOnlyQueryParsing.TryParse(value, out var result))
                return result;
        }

        if (reader.TokenType == JsonTokenType.Number)
        {
            if (reader.TryGetInt32(out var days))
                return DateOnly.FromDayNumber(days);
        }

        throw new JsonException($"Unable to parse DateOnly from token: {reader.TokenType}");
    }

    public override void Write(Utf8JsonWriter writer, DateOnly value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
    }
}
