namespace Domain.Mails;

[Mail("Visa Application Update", "visa-application-rejected")]
public sealed record VisaApplicationRejectedMail(
    string CustomerName,
    string ParticipantName,
    string DestinationCountry,
    string RefusalReason,
    string ResubmitLink);
