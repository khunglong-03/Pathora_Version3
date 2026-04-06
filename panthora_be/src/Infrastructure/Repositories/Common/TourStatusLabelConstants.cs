namespace Infrastructure.Repositories.Common;

public static class TourStatusLabelConstants
{
    // Booking statuses
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string Deposited = "Deposited";
    public const string Paid = "Paid";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";

    // Visa statuses
    public const string VisaPending = "Pending";
    public const string VisaUnderReview = "Under Review";
    public const string VisaApproved = "Approved";
    public const string VisaRejected = "Rejected";
}
