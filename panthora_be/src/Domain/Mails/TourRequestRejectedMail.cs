namespace Domain.Mails;

[Mail("Tour Request Update", "tour-request-rejected")]
public sealed record TourRequestRejectedMail(
    string CustomerName,
    string Destination,
    string AdminNote,
    string ResubmitLink);
