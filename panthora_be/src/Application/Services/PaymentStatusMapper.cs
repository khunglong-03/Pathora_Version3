using Domain.Entities;
using Domain.Enums;

namespace Application.Services;

public static class PaymentStatusMapper
{
    public const string Pending = "pending";
    public const string Paid = "paid";
    public const string Cancelled = "cancelled";
    public const string Expired = "expired";
    public const string Failed = "failed";

    public static string FromTransaction(PaymentTransactionEntity transaction)
    {
        return transaction.Status switch
        {
            TransactionStatus.Completed => Paid,
            TransactionStatus.Cancelled => Cancelled,
            TransactionStatus.Failed when string.Equals(transaction.ErrorCode, "EXPIRED", StringComparison.OrdinalIgnoreCase) => Expired,
            TransactionStatus.Failed => Failed,
            TransactionStatus.Pending => Pending,
            TransactionStatus.Processing => Pending,
            TransactionStatus.Refunded => Failed,
            _ => Failed
        };
    }

    public static string FromProviderStatus(string? providerStatus)
    {
        if (string.IsNullOrWhiteSpace(providerStatus))
        {
            return Pending;
        }

        return providerStatus.Trim().ToUpperInvariant() switch
        {
            "PAID" or "SUCCESS" or "SUCCEEDED" or "COMPLETED" => Paid,
            "CANCEL" or "CANCELLED" or "CANCELED" => Cancelled,
            "EXPIRED" or "TIMEOUT" => Expired,
            "FAILED" or "FAIL" or "ERROR" => Failed,
            _ => Pending
        };
    }

    public static bool IsTerminal(string normalizedStatus)
    {
        return string.Equals(normalizedStatus, Paid, StringComparison.Ordinal)
            || string.Equals(normalizedStatus, Cancelled, StringComparison.Ordinal)
            || string.Equals(normalizedStatus, Expired, StringComparison.Ordinal)
            || string.Equals(normalizedStatus, Failed, StringComparison.Ordinal);
    }
}
