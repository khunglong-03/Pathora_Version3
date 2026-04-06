using System.Text;
using System.Text.RegularExpressions;

namespace Common.Extensions;

public static class StringExtension
{
    private static readonly Dictionary<char, char> VietnameseDiacritics = new()
    {
        {'à', 'a'}, {'á', 'a'}, {'ả', 'a'}, {'ã', 'a'}, {'ạ', 'a'},
        {'ă', 'a'}, {'ằ', 'a'}, {'ắ', 'a'}, {'ẳ', 'a'}, {'ẵ', 'a'}, {'ặ', 'a'},
        {'â', 'a'}, {'ầ', 'a'}, {'ấ', 'a'}, {'ẩ', 'a'}, {'ẫ', 'a'}, {'ậ', 'a'},
        {'è', 'e'}, {'é', 'e'}, {'ẻ', 'e'}, {'ẽ', 'e'}, {'ẹ', 'e'},
        {'ê', 'e'}, {'ề', 'e'}, {'ế', 'e'}, {'ể', 'e'}, {'ễ', 'e'}, {'ệ', 'e'},
        {'ì', 'i'}, {'í', 'i'}, {'ỉ', 'i'}, {'ĩ', 'i'}, {'ị', 'i'},
        {'ò', 'o'}, {'ó', 'o'}, {'ỏ', 'o'}, {'õ', 'o'}, {'ọ', 'o'},
        {'ô', 'o'}, {'ồ', 'o'}, {'ố', 'o'}, {'ổ', 'o'}, {'ỗ', 'o'}, {'ộ', 'o'},
        {'ơ', 'o'}, {'ờ', 'o'}, {'ớ', 'o'}, {'ở', 'o'}, {'ỡ', 'o'}, {'ợ', 'o'},
        {'ù', 'u'}, {'ú', 'u'}, {'ủ', 'u'}, {'ũ', 'u'}, {'ụ', 'u'},
        {'ư', 'u'}, {'ừ', 'u'}, {'ứ', 'u'}, {'ử', 'u'}, {'ữ', 'u'}, {'ự', 'u'},
        {'ỳ', 'y'}, {'ý', 'y'}, {'ỷ', 'y'}, {'ỹ', 'y'}, {'ỵ', 'y'},
        {'đ', 'd'}, {'Đ', 'D'},
    };

    public static string RemoveDiacritics(this string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        var sb = new StringBuilder();
        foreach (var c in input)
        {
            sb.Append(VietnameseDiacritics.GetValueOrDefault(c, c));
        }
        return sb.ToString();
    }

    public static string TruncateString(this string? value, int maxLength = 0)
    {
        if (string.IsNullOrEmpty(value) || maxLength <= 0)
            return string.Empty;

        return value.Length > maxLength
            ? string.Concat(value.AsSpan(0, maxLength), "...")
            : value;
    }
    public static string Slugify(this string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        string result = Regex.Replace(input, @"\s+", "-");
        result = Regex.Replace(result, @"[^a-zA-Z0-9\-_]", "");
        result = Regex.Replace(result, "-{2,}", "-");
        return result.Trim('-');
    }
    public static TEnum? ToEnum<TEnum>(this string str) where TEnum : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(str))
            return null;
        return Enum.TryParse<TEnum>(str, true, out var result) ? result : null;
    }
}
