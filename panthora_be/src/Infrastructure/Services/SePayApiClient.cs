using System.Net.Http.Headers;
using System.Text.Json;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Application.Options;
using Application.Services;

namespace Infrastructure.Services;

public sealed class SePayApiClient : ISePayApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly ILogger<SePayApiClient> _logger;
    private readonly string _accountNumber;
    private readonly string _authenticationKey;
    private readonly string _apiUrl;

    public SePayApiClient(HttpClient httpClient, IOptions<SePayOptions> options, ILogger<SePayApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        var opts = options.Value;
        _accountNumber = NormalizeConfigValue(opts.AccountNumber);
        _authenticationKey = NormalizeConfigValue(opts.ApiKey);
        _apiUrl = NormalizeConfigValue(opts.ApiUrl);
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_authenticationKey)
        && !string.IsNullOrWhiteSpace(_accountNumber)
        && !string.IsNullOrWhiteSpace(_apiUrl);

    public async Task<List<SePayTransaction>> FetchTransactionsInRangeAsync(DateTimeOffset from, DateTimeOffset to, CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("SePay API is not configured. Skipping transaction fetch.");
            return [];
        }

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _authenticationKey);

        var url = $"{_apiUrl.TrimEnd('/')}/userapi/transactions/list" +
            $"?account_number={Uri.EscapeDataString(_accountNumber)}" +
            $"&transaction_date_min={Uri.EscapeDataString(ToSePayTz(from).ToString("yyyy-MM-dd HH:mm:ss"))}" +
            $"&transaction_date_max={Uri.EscapeDataString(ToSePayTz(to).ToString("yyyy-MM-dd HH:mm:ss"))}" +
            $"&limit=5000";

        _logger.LogDebug("Fetching SePay transactions UTC {FromUtc} -> {ToUtc} (ICT {FromIct} -> {ToIct})", from, to, ToSePayTz(from), ToSePayTz(to));

        var response = await _httpClient.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        _logger.LogDebug("SePay raw response (first 500 chars): {Json}", json.Length > 500 ? json[..500] + "..." : json);

        var result = JsonSerializer.Deserialize<SePayApiResponse>(json, JsonOptions);

        if (result?.Transactions != null)
        {
            foreach (var t in result.Transactions)
            {
                var parsed = SepayParsingHelper.ParseAmount(t.amount_in, t.amount_out);
                _logger.LogDebug("SePay TX: id={Id} content={Content} amount_in={AmountIn} amount_out={AmountOut} parsed={Parsed}",
                    t.id, t.transaction_content, t.amount_in, t.amount_out, parsed);
            }
        }

        var filtered = result?.Transactions?
            .Where(t => SepayParsingHelper.ParseAmount(t.amount_in, t.amount_out) > 0)
            .ToList() ?? [];

        _logger.LogDebug("SePay returned {Total} transactions, {Filtered} with amount_in > 0",
            result?.Transactions?.Count ?? 0, filtered.Count);

        return filtered;
    }

    public async Task<SePayApiResponse> FetchTransactionsAsync(CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("SePay API is not configured. Skipping transaction fetch.");
            return new SePayApiResponse { Status = 0, Transactions = [] };
        }

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _authenticationKey);

        var url = $"{_apiUrl.TrimEnd('/')}/userapi/transactions/list?account_number={Uri.EscapeDataString(_accountNumber)}&limit=50";

        _logger.LogDebug("Fetching SePay transactions from {Url}", url);

        var response = await _httpClient.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        var result = JsonSerializer.Deserialize<SePayApiResponse>(json, JsonOptions);

        _logger.LogDebug("SePay returned {Count} transactions", result?.Transactions?.Count ?? 0);

        return result ?? new SePayApiResponse { Status = 0, Transactions = [] };
    }

    public async Task<SePayTransaction?> FindTransactionByRefCodeAsync(
        string referenceCode,
        string transactionCode,
        long amount,
        CancellationToken ct = default)
    {
        var allTransactions = await FetchTransactionsAsync(ct);

        if (allTransactions.Transactions == null || allTransactions.Transactions.Count == 0)
        {
            return null;
        }

        foreach (var transaction in allTransactions.Transactions)
        {
            var txAmount = SepayParsingHelper.ParseAmount(transaction.amount_in, transaction.amount_out);
            var content = transaction.transaction_content ?? string.Empty;

            bool matched;
            if (!string.IsNullOrEmpty(referenceCode)
                && content.Contains(referenceCode, StringComparison.OrdinalIgnoreCase))
            {
                matched = true;
            }
            else if (content.Contains(transactionCode, StringComparison.OrdinalIgnoreCase))
            {
                matched = true;
            }
            else
            {
                matched = false;
            }

            if (matched && txAmount > 0 && txAmount == amount)
            {
                _logger.LogInformation(
                    "Found matching SePay transaction: {TransactionId}, Amount: {Amount}, RefCode: {RefCode}",
                    transaction.id, txAmount, referenceCode);
                return transaction;
            }
        }

        return null;
    }

    private static string NormalizeConfigValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var trimmed = value.Trim();
        if (trimmed.StartsWith("${", StringComparison.Ordinal) && trimmed.EndsWith("}", StringComparison.Ordinal))
            return string.Empty;

        return trimmed;
    }

    /// <summary>
    /// Converts UTC DateTimeOffset to SePay API timezone (ICT = UTC+7).
    /// SePay API stores transaction times in ICT and queries expect ICT-formatted dates.
    /// </summary>
    private static DateTimeOffset ToSePayTz(DateTimeOffset utc)
        => utc.ToOffset(TimeSpan.FromHours(7));
}
