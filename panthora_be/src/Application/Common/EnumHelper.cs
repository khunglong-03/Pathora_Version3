namespace Application.Common;

/// <summary>
/// Helper for parsing string values into defined enum members.
/// Rejects out-of-range numeric values and undefined names (but allows "Other" = 99
/// for LocationType and TransportationType since it is a valid sentinel value).
/// </summary>
public static class EnumHelper
{
    /// <summary>
    /// Parses a string value into a defined enum member.
    /// Accepts numeric string (e.g. "3") or name string (e.g. "Flight"), case-insensitive.
    /// Returns false if the value is null/empty/whitespace, if the numeric value is not
    /// defined in the enum, or if the name string does not match any defined member.
    /// </summary>
    public static bool TryParseDefinedEnum<TEnum>(string? value, out TEnum parsedValue)
        where TEnum : struct, Enum
    {
        parsedValue = default;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        // Try numeric string (e.g. "3")
        if (int.TryParse(value, out var numericValue)
            && Enum.IsDefined(typeof(TEnum), numericValue))
        {
            parsedValue = (TEnum)Enum.ToObject(typeof(TEnum), numericValue);
            return true;
        }

        // Try name string (e.g. "Flight"), case-insensitive
        if (Enum.TryParse<TEnum>(value, ignoreCase: true, out var enumValue)
            && Enum.IsDefined(typeof(TEnum), enumValue))
        {
            parsedValue = enumValue;
            return true;
        }

        return false;
    }
}
