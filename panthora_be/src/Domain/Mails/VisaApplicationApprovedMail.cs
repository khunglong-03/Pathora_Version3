namespace Domain.Mails;

[Mail("Visa Application Approved", "visa-application-approved")]
public sealed record VisaApplicationApprovedMail(
    string CustomerName,
    string ParticipantName,
    string DestinationCountry,
    string ViewLink);
