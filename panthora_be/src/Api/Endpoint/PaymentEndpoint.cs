namespace Api.Endpoint;

public static class PaymentEndpoint
{
    public const string Base = "api/payment";
    public const string GetQR = "getQR";
    public const string CreateTransaction = "create-transaction";
    public const string SepayWebhook = "sepay/webhook";
    public const string GetTransaction = "transaction/{code}";
    public const string GetTransactionStatus = "transaction/{code}/status";
    public const string CheckPayment = "transaction/{code}/check";
    public const string ExpireTransaction = "transaction/{code}/expire";
    public const string Return = "return";
    public const string Cancel = "cancel";
}
