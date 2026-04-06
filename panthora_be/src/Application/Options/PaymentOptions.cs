namespace Application.Options;

public class PaymentOptions
{
    public const string Payment = "Payment";
    public int TransactionExpirationMinutes { get; init; } = 30;
    public int FallbackExpirationMinutes { get; init; } = 15;
}
