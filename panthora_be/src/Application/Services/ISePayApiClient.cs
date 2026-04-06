namespace Application.Services;

public interface ISePayApiClient
{
    /// <summary>
    /// Fetches all recent transactions from SePay for the configured account.
    /// </summary>
    Task<SePayApiResponse> FetchTransactionsAsync(CancellationToken ct = default);

    /// <summary>
    /// Finds a transaction matching the given reference code and amount.
    /// Returns null if no matching transaction is found.
    /// </summary>
    Task<SePayTransaction?> FindTransactionByRefCodeAsync(string referenceCode, string transactionCode, long amount, CancellationToken ct = default);

    /// <summary>
    /// Fetches all recent transactions from SePay within a date range.
    /// Returns only transactions with amount_in > 0 (excludes payouts and zero-amount).
    /// </summary>
    Task<List<SePayTransaction>> FetchTransactionsInRangeAsync(DateTimeOffset from, DateTimeOffset to, CancellationToken ct = default);

    /// <summary>
    /// Checks whether the SePay API is configured (all required config values are non-empty).
    /// </summary>
    bool IsConfigured { get; }
}
