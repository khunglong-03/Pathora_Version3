using System.Globalization;
using System.Text;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public static partial class SepayParsingHelper
{
    private static ILogger? _logger;

    public static void SetLogger(ILogger? logger) => _logger = logger;

    public static decimal ParseAmount(string? amountIn, string? amountOut)
    {
        var parsed = TryParseSepay(amountIn, isPrimary: true);
        if (parsed.HasValue)
            return parsed.Value;

        return TryParseSepay(amountOut, isPrimary: false) ?? 0m;
    }

    private static decimal? TryParseSepay(string? input, bool isPrimary)
    {
        if (string.IsNullOrWhiteSpace(input))
            return null;

        // Strip currency symbols and spaces
        var stripped = input.Trim()
            .Replace("đ", "").Replace("Đ", "")
            .Replace("VND", "").Replace("vnd", "")
            .Replace(" ", "");

        if (string.IsNullOrEmpty(stripped))
            return null;

        // Handle "+" prefix: in Vietnamese format, "+" indicates positive amount and
        // periods AFTER "+" are thousands separators (not decimal points).
        // Strip "+" and then handle periods specially:
        // - If comma exists: comma = decimal, periods = thousands
        // - If no comma but period exists AND input had "+": periods = thousands
        // - Otherwise: no decimal in the input, strip all separators
        // In Vietnamese SePay format, periods are ALWAYS thousands separators.
        // The "+" prefix only indicates positive amount (not decimal indicator).
        // "120.000đ" → 120000 (period = thousands sep)
        // "+3.000 đ" → 3000 (same, + is not a decimal indicator)
        var hadPlusSign = stripped.StartsWith('+');
        stripped = stripped.TrimStart('+');

        var hasPeriod = stripped.Contains('.');
        var hasComma = stripped.Contains(',');

        if (hasComma && hasPeriod)
        {
            // European format: comma = decimal separator, periods = thousands
            stripped = stripped.Replace(".", "");
            var commaIdx = stripped.LastIndexOf(',');
            var intPart = stripped[..commaIdx];
            var decPart = stripped[(commaIdx + 1)..];
            stripped = intPart + "." + decPart;
        }
        else if (hasPeriod && !hasComma)
        {
            // Vietnamese VND format: ALL periods are thousands separators
            // e.g., "3.000" = 3000, "120.000" = 120000, "6.000.000" = 6000000
            stripped = stripped.Replace(".", "");
        }
        else if (hasComma && !hasPeriod)
        {
            // Comma = thousands separator (no decimal)
            stripped = stripped.Replace(",", "");
        }
        // else: plain integer, no changes needed

        if (decimal.TryParse(stripped, NumberStyles.Any, CultureInfo.InvariantCulture, out var result))
            return result;

        // Log warning on parse failure — only log primary source to avoid spam from null/out fallbacks
        if (isPrimary && _logger != null)
        {
            _logger.LogWarning("SepayParsingHelper: Failed to parse amount \"{Input}\" -> \"{Stripped}\"", input, stripped);
        }
        return null;
    }

    private static readonly TimeSpan IctOffset = TimeSpan.FromHours(7);

    public static DateTimeOffset ParseDate(string? dateStr)
    {
        if (string.IsNullOrWhiteSpace(dateStr))
            return DateTimeOffset.UtcNow;

        // 1. Vietnamese dd/MM/yyyy HH:mm:ss (SePay's actual format)
        // SePay returns dates in ICT timezone (UTC+7) without offset info,
        // so we parse as local and explicitly apply ICT offset.
        if (DateTimeOffset.TryParseExact(
            dateStr,
            ["dd/MM/yyyy HH:mm:ss"],
            new CultureInfo("vi-VN"),
            DateTimeStyles.None,
            out var parsed))
            return new DateTimeOffset(parsed.Year, parsed.Month, parsed.Day, parsed.Hour, parsed.Minute, parsed.Second, parsed.Millisecond, IctOffset);

        // 2. ISO-like yyyy-MM-dd HH:mm:ss — parse as UTC
        if (DateTimeOffset.TryParseExact(
            dateStr,
            ["yyyy-MM-dd HH:mm:ss", "yyyy/MM/dd HH:mm:ss"],
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out parsed))
            return parsed;

        // 3. Generic parse as last resort
        if (DateTimeOffset.TryParse(dateStr, CultureInfo.InvariantCulture, DateTimeStyles.None, out parsed))
            return parsed;

        return DateTimeOffset.UtcNow;
    }

    public static SepayTransactionData ToTransactionData(SePayTransaction t)
    {
        return new SepayTransactionData
        {
            TransactionId = t.id ?? throw new ArgumentNullException(nameof(t.id), "SePay transaction id cannot be null"),
            BeneficiaryBank = t.gateway,
            BankBrandName = t.bank_brand_name,
            AccountNumber = t.account_number ?? string.Empty,
            TransactionDate = ParseDate(t.transaction_date),
            Amount = ParseAmount(t.amount_in, t.amount_out),
            TransactionContent = t.transaction_content ?? string.Empty,
            ReferenceNumber = t.reference_number ?? string.Empty,
            // Keep the internal reference code on our transaction untouched.
            // SePay's `reference_number` is a provider-side SMS reference, not our 12-char ref code.
            ReferenceCode = null
        };
    }

    public static decimal? TryParse(string? s)
    {
        if (string.IsNullOrWhiteSpace(s))
            return null;

        var cleaned = s.Replace(",", ".", StringComparison.Ordinal).Trim();
        if (decimal.TryParse(cleaned, NumberStyles.Any, CultureInfo.InvariantCulture, out var result))
            return result;

        return null;
    }

    private static string RemoveDiacritics(string? s)
    {
        if (string.IsNullOrWhiteSpace(s))
            return string.Empty;

        var normalized = s.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        return sb.ToString().Normalize(NormalizationForm.FormC);
    }
}
