namespace Domain.Mails;

[Mail("New Tour Request Notification", "tour-request-submitted")]
public sealed record TourRequestSubmittedMail(
    string CustomerName,
    string Destination,
    string StartDate,
    string EndDate,
    int NumberOfParticipants,
    string BudgetPerPersonUsd,
    string DashboardLink);
