namespace Domain.Mails;

[Mail("Your Tour Request Has Been Approved!", "tour-request-approved")]
public sealed record TourRequestApprovedMail(
    string CustomerName,
    string Destination,
    string StartDate,
    string EndDate,
    string AdminNote,
    string MyRequestsLink);
