namespace Domain.Mails;

[Mail("Visa Service Fee Quoted", "visa-service-fee-quoted")]
public sealed record VisaServiceFeeQuotedMail(
    string CustomerName,
    string ParticipantName,
    string DestinationCountry,
    string Fee,
    string PaymentLink);
