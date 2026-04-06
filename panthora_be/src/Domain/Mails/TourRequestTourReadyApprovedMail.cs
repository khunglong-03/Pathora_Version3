namespace Domain.Mails;

[Mail("Your Tour Request Has Been Approved!", "tour-request-tour-ready-approved")]
public sealed record TourRequestTourReadyApprovedMail(
    string CustomerName,
    string TourTitle,
    string ClassificationName,
    string StartDate,
    string EndDate,
    string BasePrice,
    string IncludedServices,
    string TourInstanceDetailLink,
    string AdminNote);
