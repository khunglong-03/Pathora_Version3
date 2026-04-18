using System.Globalization;
using System.Text.Json.Serialization;

using Application.Services;

namespace Application.Contracts.Payment;

public sealed record SepayWebhookRequest
{
    [JsonPropertyName("id")]
    public long Id { get; init; }

    [JsonPropertyName("gateway")]
    public string? Gateway { get; init; }

    [JsonPropertyName("transactionDate")]
    public string? TransactionDate { get; init; }

    [JsonPropertyName("accountNumber")]
    public string? AccountNumber { get; init; }

    [JsonPropertyName("code")]
    public string? Code { get; init; }

    [JsonPropertyName("content")]
    public string? Content { get; init; }

    [JsonPropertyName("transferType")]
    public string? TransferType { get; init; }

    [JsonPropertyName("transferAmount")]
    public decimal? TransferAmount { get; init; }

    [JsonPropertyName("accumulated")]
    public decimal? Accumulated { get; init; }

    [JsonPropertyName("subAccount")]
    public string? SubAccount { get; init; }

    [JsonPropertyName("referenceCode")]
    public string? ReferenceNumber { get; init; }

    [JsonPropertyName("description")]
    public string? Description { get; init; }

    public bool IsInboundTransfer
        => string.Equals(TransferType, "in", StringComparison.OrdinalIgnoreCase);

    public SepayTransactionData ToTransactionData()
    {
        return new SepayTransactionData
        {
            TransactionId = Id.ToString(CultureInfo.InvariantCulture),
            BeneficiaryBank = Gateway,
            BankBrandName = Gateway,
            AccountNumber = AccountNumber ?? string.Empty,
            TransactionDate = SepayParsingHelper.ParseDate(TransactionDate),
            Amount = TransferAmount ?? 0m,
            TransactionContent = string.IsNullOrWhiteSpace(Content) ? Description ?? string.Empty : Content,
            ReferenceNumber = ReferenceNumber ?? string.Empty,
            // Preserve the internal reference code already stored on our transaction.
            ReferenceCode = null
        };
    }
}
