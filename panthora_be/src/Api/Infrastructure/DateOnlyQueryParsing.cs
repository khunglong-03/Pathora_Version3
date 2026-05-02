using System.Globalization;

namespace Api.Infrastructure;

/// <summary>
/// Parses <see cref="DateOnly"/> from query strings: <c>yyyy-MM-dd</c> and ISO-8601 date-time (e.g. <c>2026-05-28T00:00:00.000Z</c>).
/// The default ASP.NET <see cref="DateOnly"/> binder only accepts a narrow set of formats; clients often send full ISO from JS <see cref="Date"/> serialization.
/// </summary>
public static class DateOnlyQueryParsing
{
    public static bool TryParse(string? raw, out DateOnly date)
    {
        date = default;
        if (string.IsNullOrWhiteSpace(raw))
            return false;

        var s = raw.Trim();

        if (DateOnly.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
            return true;

        if (DateOnly.TryParse(s, out date))
            return true;

        if (DateTimeOffset.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var o))
        {
            date = new DateOnly(o.Year, o.Month, o.Day);
            return true;
        }

        if (DateTimeOffset.TryParse(s, out o))
        {
            date = new DateOnly(o.Year, o.Month, o.Day);
            return true;
        }

        if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var dt))
        {
            date = DateOnly.FromDateTime(dt);
            return true;
        }

        return false;
    }
}
