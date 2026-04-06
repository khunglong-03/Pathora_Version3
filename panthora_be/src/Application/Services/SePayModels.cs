namespace Application.Services;

public class SePayApiResponse
{
    public int Status { get; set; }
    public object? Error { get; set; }
    public SePayMessages? Messages { get; set; }
    public List<SePayTransaction>? Transactions { get; set; }
}

public class SePayMessages
{
    public bool Success { get; set; }
}

public class SePayTransaction
{
    public string? id { get; set; }
    public string? gateway { get; set; }
    public string? bank_brand_name { get; set; }
    public string? account_number { get; set; }
    public string? transaction_date { get; set; }
    public string? amount_out { get; set; }
    public string? amount_in { get; set; }
    public string? accumulated { get; set; }
    public string? transaction_content { get; set; }
    public string? reference_number { get; set; }
    public string? Code { get; set; }
    public string? SubAccount { get; set; }
    public string? bank_account_id { get; set; }
}

public class SepayTransactionData
{
    public string TransactionId { get; set; } = null!;
    public string? BeneficiaryBank { get; set; }
    public string? BankBrandName { get; set; }
    public string? AccountNumber { get; set; }
    public DateTimeOffset TransactionDate { get; set; }
    public decimal Amount { get; set; }
    public string? TransactionContent { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? ReferenceCode { get; set; }
}
