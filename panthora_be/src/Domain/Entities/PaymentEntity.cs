namespace Domain.Entities;

public class PaymentEntity : Aggregate<Guid>
{
    public Guid PaidUser { get; set; }
    public Guid? BookingId { get; set; }
    public string? TransactionId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public string? PaymentDescription { get; set; }
    public DateTime TransactionTimestamp { get; set; }

    // Party Info
    public string? SenderName { get; set; }
    public string? SenderAccountNumber { get; set; }
    public string? ReceiverName { get; set; }
    public string? ReceiverAccountNumber { get; set; }
    public string? BeneficiaryBank { get; set; }

    // Tax & Billing Info
    public string? TaxCode { get; set; }
    public string? BillingAddress { get; set; }
    public decimal TaxAmount { get; set; }
    public double TaxRate { get; set; } // e.g., 0.1 for 10%
}
