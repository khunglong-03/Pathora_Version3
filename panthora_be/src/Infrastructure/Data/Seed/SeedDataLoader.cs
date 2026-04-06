using System.Text.Json;
using System.Text.Json.Serialization;

namespace Infrastructure.Data.Seed;

internal static class SeedDataLoader
{
    private const string SeedDirectoryName = "Seeddata";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters =
        {
            new JsonStringEnumConverter(),
            new DateTimeOffsetJsonConverter()
        }
    };

    public static List<T>? LoadData<T>(string fileName)
    {
        var seedFilePath = ResolveSeedFilePath(fileName);

        if (!File.Exists(seedFilePath))
        {
            return null;
        }

        return DeserializeSeedList<T>(seedFilePath);
    }

    public static SeedFileValidationResult ValidateSeedFile(string fileName, IReadOnlyCollection<string> requiredFields, string? basePath = null)
    {
        var seedFilePath = ResolveSeedFilePath(fileName, basePath);
        var issues = new List<SeedFileValidationIssue>();

        if (!File.Exists(seedFilePath))
        {
            issues.Add(new SeedFileValidationIssue(null, $"Missing seed file: {seedFilePath}"));
            return new SeedFileValidationResult(fileName, seedFilePath, issues);
        }

        var rawJson = ReadFileSafely(seedFilePath, issues);
        if (rawJson is null)
        {
            return new SeedFileValidationResult(fileName, seedFilePath, issues);
        }

        ValidateJsonShapeAndRequiredFields(rawJson, requiredFields, issues);
        return new SeedFileValidationResult(fileName, seedFilePath, issues);
    }

    public static string ResolveSeedFilePath(string fileName, string? basePath = null)
    {
        var runtimeBasePath = basePath ?? Path.GetDirectoryName(typeof(SeedDataLoader).Assembly.Location) ?? string.Empty;
        return Path.Combine(runtimeBasePath, "Data", "Seed", SeedDirectoryName, fileName);
    }

    private static List<T> DeserializeSeedList<T>(string seedFilePath)
    {
        var rawJson = File.ReadAllText(seedFilePath).Trim();

        if (string.IsNullOrWhiteSpace(rawJson))
        {
            throw new InvalidOperationException($"Seed file is empty: {seedFilePath}");
        }

        try
        {
            if (rawJson.StartsWith("[", StringComparison.Ordinal))
            {
                return JsonSerializer.Deserialize<List<T>>(rawJson, JsonOptions)
                    ?? throw new InvalidOperationException($"Unable to deserialize seed array from: {seedFilePath}");
            }

            using var document = JsonDocument.Parse(rawJson);
            if (document.RootElement.ValueKind != JsonValueKind.Object
                || !document.RootElement.TryGetProperty("data", out var dataElement)
                || dataElement.ValueKind != JsonValueKind.Array)
            {
                throw new InvalidOperationException($"Seed file must be either a JSON array or an object containing an array property named 'data': {seedFilePath}");
            }

            return JsonSerializer.Deserialize<List<T>>(dataElement.GetRawText(), JsonOptions)
                ?? throw new InvalidOperationException($"Unable to deserialize seed data array from: {seedFilePath}");
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException($"Invalid JSON format in seed file '{seedFilePath}': {ex.Message}", ex);
        }
    }

    private static string? ReadFileSafely(string filePath, List<SeedFileValidationIssue> issues)
    {
        try
        {
            return File.ReadAllText(filePath).Trim();
        }
        catch (Exception ex)
        {
            issues.Add(new SeedFileValidationIssue(null, $"Unable to read seed file '{filePath}': {ex.Message}"));
            return null;
        }
    }

    private static void ValidateJsonShapeAndRequiredFields(string rawJson, IReadOnlyCollection<string> requiredFields, List<SeedFileValidationIssue> issues)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
        {
            issues.Add(new SeedFileValidationIssue(null, "Seed JSON is empty."));
            return;
        }

        try
        {
            using var document = JsonDocument.Parse(rawJson);
            if (!TryGetArrayRoot(document.RootElement, out var arrayRoot, out var shapeError))
            {
                issues.Add(new SeedFileValidationIssue(null, shapeError));
                return;
            }

            var index = 0;
            foreach (var item in arrayRoot.EnumerateArray())
            {
                if (item.ValueKind != JsonValueKind.Object)
                {
                    issues.Add(new SeedFileValidationIssue(index, "Each seed item must be a JSON object."));
                    index++;
                    continue;
                }

                foreach (var field in requiredFields)
                {
                    if (!item.TryGetProperty(field, out var fieldValue))
                    {
                        issues.Add(new SeedFileValidationIssue(index, $"Missing required field '{field}'."));
                        continue;
                    }

                    if (fieldValue.ValueKind == JsonValueKind.Null)
                    {
                        issues.Add(new SeedFileValidationIssue(index, $"Required field '{field}' must not be null."));
                        continue;
                    }

                    if (fieldValue.ValueKind == JsonValueKind.String && string.IsNullOrWhiteSpace(fieldValue.GetString()))
                    {
                        issues.Add(new SeedFileValidationIssue(index, $"Required field '{field}' must not be empty."));
                    }
                }

                index++;
            }
        }
        catch (JsonException ex)
        {
            issues.Add(new SeedFileValidationIssue(null, $"Malformed JSON: {ex.Message}"));
        }
    }

    private static bool TryGetArrayRoot(JsonElement root, out JsonElement arrayRoot, out string error)
    {
        if (root.ValueKind == JsonValueKind.Array)
        {
            arrayRoot = root;
            error = string.Empty;
            return true;
        }

        if (root.ValueKind == JsonValueKind.Object
            && root.TryGetProperty("data", out var dataElement)
            && dataElement.ValueKind == JsonValueKind.Array)
        {
            arrayRoot = dataElement;
            error = string.Empty;
            return true;
        }

        arrayRoot = default;
        error = "Unsupported JSON root shape. Expected either an array [] or an object with a 'data' array property.";
        return false;
    }
}

internal sealed record SeedFileValidationIssue(int? ItemIndex, string Message);

internal sealed record SeedFileValidationResult(
    string FileName,
    string FilePath,
    IReadOnlyList<SeedFileValidationIssue> Issues)
{
    public bool IsValid => Issues.Count == 0;
}

internal sealed class DateTimeOffsetJsonConverter : JsonConverter<DateTimeOffset>
{
    public override DateTimeOffset Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            var value = reader.GetString();
            if (string.IsNullOrEmpty(value))
                return default;

            // Try parsing as ISO 8601 with timezone
            if (DateTimeOffset.TryParse(value, out var result))
                return result.ToUniversalTime();

            // Try parsing just date (no time) - treat as UTC midnight
            if (DateTime.TryParse(value, out var dateResult))
                return new DateTimeOffset(dateResult.Date, TimeSpan.Zero);
        }

        return default;
    }

    public override void Write(Utf8JsonWriter writer, DateTimeOffset value, JsonSerializerOptions options)
    {
        // Always write as UTC ISO 8601 string
        writer.WriteStringValue(value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"));
    }
}
