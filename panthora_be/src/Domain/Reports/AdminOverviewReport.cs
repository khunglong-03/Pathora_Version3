namespace Domain.Reports;

public sealed record AdminOverviewReport(
    AdminDashboardStatsReport Stats,
    List<AdminCustomerReport> Customers,
    List<AdminPaymentReport> Payments,
    List<AdminInsuranceReport> Insurances,
    List<AdminVisaApplicationReport> VisaApplications);

public sealed record AdminDashboardStatsReport(
    decimal TotalRevenue,
    int TotalBookings,
    int ActiveTours,
    int TotalCustomers,
    decimal CancellationRate,
    decimal VisaApprovalRate);

public sealed record AdminCustomerReport(
    string Id,
    string Name,
    string Email,
    string Phone,
    string Nationality,
    int TotalBookings,
    decimal TotalSpent,
    string Status,
    string LastBooking);

public sealed record AdminPaymentReport(
    string Id,
    string Booking,
    string Customer,
    string Method,
    decimal Amount,
    string Status,
    string Date);

public sealed record AdminInsuranceReport(
    string Id,
    string Booking,
    string Customer,
    string Type,
    string Coverage,
    decimal Premium,
    string Status,
    string StartDate,
    string EndDate);

public sealed record AdminVisaApplicationReport(
    string Id,
    string Booking,
    string Applicant,
    string Passport,
    string Country,
    string Type,
    string Status,
    string SubmittedDate,
    string DecisionDate);
