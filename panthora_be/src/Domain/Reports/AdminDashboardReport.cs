namespace Domain.Reports;

public sealed record AdminDashboardReport(
    AdminDashboardStatsReport Stats,
    List<AdminDashboardMetricPointReport> RevenueOverTime,
    List<AdminDashboardCategoryMetricReport> RevenueByTourType,
    List<AdminDashboardCategoryMetricReport> RevenueByRegion,
    List<AdminDashboardCategoryMetricReport> BookingStatusDistribution,
    List<AdminDashboardMetricPointReport> BookingTrend,
    List<AdminDashboardTopTourReport> TopTours,
    List<AdminDashboardCategoryMetricReport> TopDestinations,
    List<AdminDashboardMetricPointReport> CustomerGrowth,
    List<AdminDashboardCategoryMetricReport> CustomerNationalities,
    List<AdminDashboardVisaStatusReport> VisaStatuses,
    List<AdminDashboardVisaDeadlineReport> UpcomingVisaDeadlines,
    AdminDashboardVisaSummaryReport VisaSummary,
    List<AdminDashboardAlertReport> Alerts);

public sealed record AdminDashboardMetricPointReport(string Label, decimal Value);

public sealed record AdminDashboardCategoryMetricReport(string Label, decimal Value);

public sealed record AdminDashboardTopTourReport(string Name, int Bookings, decimal Revenue);

public sealed record AdminDashboardVisaStatusReport(string Label, int Count);

public sealed record AdminDashboardVisaDeadlineReport(string Tour, string Date);

public sealed record AdminDashboardVisaSummaryReport(int TotalApplications, int Approved, int Rejected, decimal ApprovalRate);

public sealed record AdminDashboardAlertReport(string Text, string Severity);
