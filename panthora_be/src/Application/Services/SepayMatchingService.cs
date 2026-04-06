using Domain.Entities;

namespace Application.Services;

/// <summary>
/// 3-tier matching logic for SePay transactions against internal payment transactions.
/// Tier 1: Exact refcode match | Tier 2: Partial substring match | Tier 3: Content search
/// </summary>
public static class SepayMatchingService
{
    private const decimal AmountTolerance = 0.01m;

    /// <summary>
    /// Attempts to match a SePay transaction against a pending payment transaction.
    /// Returns the matched transaction or null if no match.
    /// </summary>
    public static SePayTransaction? MatchTransaction(
        SePayTransaction sepayTx,
        PaymentTransactionEntity pendingTx)
    {
        var sepayRefNumber = sepayTx.reference_number ?? string.Empty;
        var sepayContent = (sepayTx.transaction_content ?? string.Empty).Trim();
        var pendingRefCode = pendingTx.ReferenceCode ?? string.Empty;
        var pendingTxCode = pendingTx.TransactionCode;

        // Always check amount first — skip if amount doesn't match within tolerance
        var sepayAmount = SepayParsingHelper.ParseAmount(sepayTx.amount_in, sepayTx.amount_out);
        if (!AmountsMatch(sepayAmount, pendingTx.Amount))
            return null;

        // Tier 1 — Exact match on ReferenceNumber
        if (MatchTier1(sepayRefNumber, pendingRefCode))
            return sepayTx;

        // Tier 2 — Partial substring match
        if (MatchTier2(sepayRefNumber, pendingRefCode))
            return sepayTx;

        // Tier 3 — Content match (refcode variants in transaction_content)
        if (MatchTier3(sepayContent, pendingRefCode, pendingTxCode))
            return sepayTx;

        return null;
    }

    private static bool AmountsMatch(decimal sepayAmount, decimal pendingAmount)
        => Math.Abs(sepayAmount - pendingAmount) <= AmountTolerance;

    /// <summary>
    /// Tier 1: Exact match
    /// - refNumber == refCode (full match)
    /// - refNumber == numeric-only (strips "DEP" prefix)
    /// - refNumber == last 14 chars of refCode
    /// </summary>
    private static bool MatchTier1(string sepayRefNumber, string pendingRefCode)
    {
        if (string.IsNullOrEmpty(pendingRefCode) || string.IsNullOrEmpty(sepayRefNumber))
            return false;

        // Exact match
        if (string.Equals(sepayRefNumber, pendingRefCode, StringComparison.Ordinal))
            return true;

        // Strip "DEP" prefix and try again
        var pendingNumeric = StripDepPrefix(pendingRefCode);
        var sepayNumeric = StripDepPrefix(sepayRefNumber);
        if (!string.IsNullOrEmpty(pendingNumeric) && string.Equals(sepayNumeric, pendingNumeric, StringComparison.Ordinal))
            return true;

        // Last 14 characters
        if (pendingRefCode.Length >= 14)
        {
            var last14 = pendingRefCode[^14..];
            if (string.Equals(sepayRefNumber, last14, StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    /// <summary>
    /// Tier 2: Partial substring match
    /// - refNumber contains last 8/10/15 chars of refCode (or vice versa)
    /// </summary>
    private static bool MatchTier2(string sepayRefNumber, string pendingRefCode)
    {
        if (string.IsNullOrEmpty(pendingRefCode) || string.IsNullOrEmpty(sepayRefNumber))
            return false;

        // Try various substring lengths
        var lengths = new[] { 15, 10, 8 };
        foreach (var len in lengths)
        {
            if (pendingRefCode.Length >= len)
            {
                var suffix = pendingRefCode[^len..];
                if (sepayRefNumber.Contains(suffix, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            if (sepayRefNumber.Length >= len)
            {
                var suffix = sepayRefNumber[^len..];
                if (pendingRefCode.Contains(suffix, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Tier 3: Content match
    /// - Find refCode (and variants) in transaction_content with amount tolerance
    /// </summary>
    private static bool MatchTier3(string sepayContent, string pendingRefCode, string pendingTxCode)
    {
        if (string.IsNullOrEmpty(sepayContent))
            return false;

        // Extract all tokens from content
        var tokens = sepayContent.Split(new[] { ' ', '|', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);

        foreach (var token in tokens)
        {
            var t = token.Trim();
            if (string.IsNullOrEmpty(t))
                continue;

            // Check exact match
            if (!string.IsNullOrEmpty(pendingRefCode)
                && string.Equals(t, pendingRefCode, StringComparison.Ordinal))
                return true;

            // Check last 14 chars match
            if (!string.IsNullOrEmpty(pendingRefCode) && pendingRefCode.Length >= 14
                && string.Equals(t, pendingRefCode[^14..], StringComparison.Ordinal))
                return true;

            // Check "DEP"-stripped match
            var depStripped = StripDepPrefix(t);
            var refStripped = StripDepPrefix(pendingRefCode);
            if (!string.IsNullOrEmpty(depStripped) && !string.IsNullOrEmpty(refStripped)
                && string.Equals(depStripped, refStripped, StringComparison.Ordinal))
                return true;

            // Check if content contains full transaction code
            if (sepayContent.Contains(pendingTxCode, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static string StripDepPrefix(string code)
    {
        if (code.StartsWith("DEP", StringComparison.OrdinalIgnoreCase))
            return code[3..];
        return code;
    }
}
