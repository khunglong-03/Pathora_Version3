namespace Domain.Reports;

public sealed record ManagerDashboardReport(
    ManagerDashboardStatsReport Stats,
    List<ManagerDashboardCategoryMetric> TourInstancesByStatus,
    List<ManagerDashboardMetricPoint> BookingTrend,
    List<ManagerDashboardCategoryMetric> BookingStatusDistribution,
    List<ManagerDashboardTopTour> TopTours,
    List<ManagerUpcomingDeparture> UpcomingDepartures,
    List<ManagerRecentBooking> RecentBookings,
    List<ManagerStaffMember> Staff);

public sealed record ManagerDashboardStatsReport(
    int TotalTours,
    int TotalTourInstances,
    int ActiveTourInstances,
    int TotalBookings,
    int UpcomingDepartures,
    int TotalStaff);

public sealed record ManagerDashboardCategoryMetric(string Label, decimal Value);

public sealed record ManagerDashboardMetricPoint(string Label, decimal Value);

public sealed record ManagerDashboardTopTour(string Name, int Bookings, decimal Revenue);

public sealed record ManagerUpcomingDeparture(
    Guid TourInstanceId,
    string Title,
    DateTimeOffset StartDate,
    int CurrentParticipation,
    int MaxParticipation,
    string Status);

public sealed record ManagerRecentBooking(
    Guid BookingId,
    string CustomerName,
    string TourName,
    decimal Amount,
    string Status,
    DateTimeOffset BookingDate);

public sealed record ManagerStaffMember(
    Guid Id,
    string FullName,
    string Email,
    string Role,
    int TourCount);
