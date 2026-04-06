using System.Globalization;

using Domain.Common.Repositories;
using Domain.Enums;
using Domain.Reports;
using Infrastructure.Data;
using Infrastructure.Options;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Infrastructure.Repositories;

public sealed class AdminDashboardRepository(AppDbContext context, IOptions<AdminDashboardOptions> options) : IAdminDashboardRepository
{
    private readonly AdminDashboardOptions _options = options.Value;
    private static readonly CultureInfo DateCulture = CultureInfo.InvariantCulture;
    private readonly AppDbContext _context = context;

    public async Task<AdminDashboardReport> GetDashboard(CancellationToken cancellationToken = default)
    {
        var stats = await BuildDashboardStats(cancellationToken);
        var revenueOverTime = await BuildRevenueOverTime(cancellationToken);
        var revenueByTourType = await BuildRevenueByTourType(cancellationToken);
        var revenueByRegion = await BuildRevenueByRegion(cancellationToken);
        var bookingStatusDistribution = await BuildBookingStatusDistribution(cancellationToken);
        var bookingTrend = await BuildBookingTrend(cancellationToken);
        var topTours = await BuildTopTours(cancellationToken);
        var topDestinations = await BuildTopDestinations(cancellationToken);
        var customerGrowth = await BuildCustomerGrowth(cancellationToken);
        var customerNationalities = await BuildCustomerNationalities(cancellationToken);
        var visaStatuses = await BuildVisaStatuses(cancellationToken);
        var upcomingVisaDeadlines = await BuildUpcomingVisaDeadlines(cancellationToken);
        var visaSummary = await BuildVisaSummary(cancellationToken);
        var alerts = await BuildAlerts(stats, cancellationToken);

        return new AdminDashboardReport(
            Stats: stats,
            RevenueOverTime: revenueOverTime,
            RevenueByTourType: revenueByTourType,
            RevenueByRegion: revenueByRegion,
            BookingStatusDistribution: bookingStatusDistribution,
            BookingTrend: bookingTrend,
            TopTours: topTours,
            TopDestinations: topDestinations,
            CustomerGrowth: customerGrowth,
            CustomerNationalities: customerNationalities,
            VisaStatuses: visaStatuses,
            UpcomingVisaDeadlines: upcomingVisaDeadlines,
            VisaSummary: visaSummary,
            Alerts: alerts);
    }

    private async Task<AdminDashboardStatsReport> BuildDashboardStats(CancellationToken cancellationToken)
    {
        var totalRevenue = 0m;

        var totalBookings = await _context.Bookings
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var cancelledBookings = await _context.Bookings
            .AsNoTracking()
            .CountAsync(x => x.Status == BookingStatus.Cancelled, cancellationToken);

        var activeTours = await _context.TourInstances
            .AsNoTracking()
            .CountAsync(
                x => !x.IsDeleted
                    && x.Status != TourInstanceStatus.Cancelled
                    && x.Status != TourInstanceStatus.Completed,
                cancellationToken);

        var totalCustomers = await _context.Users
            .AsNoTracking()
            .CountAsync(x => !x.IsDeleted, cancellationToken);

        var approvedVisaCount = await _context.TourRequests
            .AsNoTracking()
            .CountAsync(x => x.Status == TourRequestStatus.Approved, cancellationToken);

        var finalizedVisaCount = await _context.TourRequests
            .AsNoTracking()
            .CountAsync(
                x => x.Status == TourRequestStatus.Approved
                    || x.Status == TourRequestStatus.Rejected,
                cancellationToken);

        var cancellationRate = totalBookings == 0
            ? 0m
            : Math.Round(cancelledBookings * 100m / totalBookings, 2);

        var visaApprovalRate = finalizedVisaCount == 0
            ? 0m
            : Math.Round(approvedVisaCount * 100m / finalizedVisaCount, 2);

        return new AdminDashboardStatsReport(
            TotalRevenue: totalRevenue,
            TotalBookings: totalBookings,
            ActiveTours: activeTours,
            TotalCustomers: totalCustomers,
            CancellationRate: cancellationRate,
            VisaApprovalRate: visaApprovalRate);
    }

    private async Task<List<AdminDashboardMetricPointReport>> BuildRevenueOverTime(CancellationToken cancellationToken)
    {
        var monthRange = BuildMonthRange(_options.DashboardMonthWindow);
        var start = monthRange[0].MonthStart;

        var rows = await _context.Payments
            .AsNoTracking()
            .Where(x => x.TransactionTimestamp >= start)
            .GroupBy(x => new { x.TransactionTimestamp.Year, x.TransactionTimestamp.Month })
            .Select(g => new MonthlyDecimalRow(g.Key.Year, g.Key.Month, g.Sum(x => x.Amount)))
            .ToListAsync(cancellationToken);

        var valueMap = rows.ToDictionary(x => BuildMonthKey(x.Year, x.Month), x => x.Value);

        return monthRange
            .Select(x => new AdminDashboardMetricPointReport(x.Label, valueMap.GetValueOrDefault(x.Key)))
            .ToList();
    }

    private async Task<List<AdminDashboardCategoryMetricReport>> BuildRevenueByTourType(CancellationToken cancellationToken)
    {
        var rows = await _context.Bookings
            .AsNoTracking()
            .Where(x => x.Status != BookingStatus.Cancelled)
            .GroupBy(x => x.TourInstance.InstanceType)
            .Select(g => new TourTypeRevenueRow(g.Key, g.Sum(x => x.TotalPrice)))
            .ToListAsync(cancellationToken);

        var revenueMap = rows.ToDictionary(x => x.TourType, x => x.Revenue);

        return Enum
            .GetValues<TourType>()
            .Select(x => new AdminDashboardCategoryMetricReport(x.ToString(), revenueMap.GetValueOrDefault(x)))
            .ToList();
    }

    private async Task<List<AdminDashboardCategoryMetricReport>> BuildRevenueByRegion(CancellationToken cancellationToken)
    {
        var rows = await _context.Bookings
            .AsNoTracking()
            .Where(x => x.Status != BookingStatus.Cancelled)
            .Select(x => new LocationRevenueRow(x.TourInstance.Location, x.TotalPrice))
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(x => NormalizeLocationBucket(x.Location), StringComparer.OrdinalIgnoreCase)
            .Select(g => new AdminDashboardCategoryMetricReport(g.Key, g.Sum(x => x.Revenue)))
            .OrderByDescending(x => x.Value)
            .ThenBy(x => x.Label, StringComparer.Ordinal)
            .Take(4)
            .ToList();
    }

    private async Task<List<AdminDashboardCategoryMetricReport>> BuildBookingStatusDistribution(CancellationToken cancellationToken)
    {
        var rows = await _context.Bookings
            .AsNoTracking()
            .GroupBy(x => x.Status)
            .Select(g => new BookingStatusCountRow(g.Key, g.Count()))
            .ToListAsync(cancellationToken);

        var countMap = rows.ToDictionary(x => x.Status, x => x.Count);

        return [
            new AdminDashboardCategoryMetricReport(TourStatusLabelConstants.Pending, countMap.GetValueOrDefault(BookingStatus.Pending)),
            new AdminDashboardCategoryMetricReport(TourStatusLabelConstants.Confirmed, countMap.GetValueOrDefault(BookingStatus.Confirmed)),
            new AdminDashboardCategoryMetricReport(TourStatusLabelConstants.Deposited, countMap.GetValueOrDefault(BookingStatus.Deposited)),
            new AdminDashboardCategoryMetricReport(TourStatusLabelConstants.Paid, countMap.GetValueOrDefault(BookingStatus.Paid)),
            new AdminDashboardCategoryMetricReport(TourStatusLabelConstants.Completed, countMap.GetValueOrDefault(BookingStatus.Completed)),
            new AdminDashboardCategoryMetricReport(TourStatusLabelConstants.Cancelled, countMap.GetValueOrDefault(BookingStatus.Cancelled))
        ];
    }

    private async Task<List<AdminDashboardMetricPointReport>> BuildBookingTrend(CancellationToken cancellationToken)
    {
        var monthRange = BuildMonthRange(_options.DashboardMonthWindow);
        var start = monthRange[0].MonthStart;

        var rows = await _context.Bookings
            .AsNoTracking()
            .Where(x => x.BookingDate >= start)
            .GroupBy(x => new { x.BookingDate.Year, x.BookingDate.Month })
            .Select(g => new MonthlyDecimalRow(g.Key.Year, g.Key.Month, g.Count()))
            .ToListAsync(cancellationToken);

        var valueMap = rows.ToDictionary(x => BuildMonthKey(x.Year, x.Month), x => x.Value);

        return monthRange
            .Select(x => new AdminDashboardMetricPointReport(x.Label, valueMap.GetValueOrDefault(x.Key)))
            .ToList();
    }

    private async Task<List<AdminDashboardTopTourReport>> BuildTopTours(CancellationToken cancellationToken)
    {
        var sourceRows = await _context.Bookings
            .AsNoTracking()
            .Where(x => x.Status != BookingStatus.Cancelled)
            .Select(x => new TopTourSourceRow(x.TourInstance.Title, x.TourInstance.TourName, x.TotalPrice))
            .ToListAsync(cancellationToken);

        var rows = sourceRows
            .GroupBy(x => new { x.Title, x.TourName })
            .Select(g => new TopTourRow(g.Key.Title, g.Key.TourName, g.Count(), g.Sum(x => x.Revenue)))
            .OrderByDescending(x => x.Revenue)
            .ThenByDescending(x => x.Bookings)
            .Take(_options.RankedItemLimit)
            .ToList();

        return rows
            .Select(x => new AdminDashboardTopTourReport(
                Name: ResolveTourDisplayName(x.Title, x.TourName),
                Bookings: x.Bookings,
                Revenue: x.Revenue))
            .ToList();
    }

    private async Task<List<AdminDashboardCategoryMetricReport>> BuildTopDestinations(CancellationToken cancellationToken)
    {
        var rows = await _context.Bookings
            .AsNoTracking()
            .Select(x => x.TourInstance.Location)
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(NormalizeLocationBucket, StringComparer.OrdinalIgnoreCase)
            .Select(g => new AdminDashboardCategoryMetricReport(g.Key, g.Count()))
            .OrderByDescending(x => x.Value)
            .ThenBy(x => x.Label, StringComparer.Ordinal)
            .Take(_options.RankedItemLimit)
            .ToList();
    }

    private async Task<List<AdminDashboardMetricPointReport>> BuildCustomerGrowth(CancellationToken cancellationToken)
    {
        var monthRange = BuildMonthRange(_options.CustomerGrowthMonthWindow);
        var start = monthRange[0].MonthStart;

        var rows = await _context.Users
            .AsNoTracking()
            .Where(x => x.CreatedOnUtc >= start && !x.IsDeleted)
            .GroupBy(x => new { x.CreatedOnUtc.Year, x.CreatedOnUtc.Month })
            .Select(g => new MonthlyDecimalRow(g.Key.Year, g.Key.Month, g.Count()))
            .ToListAsync(cancellationToken);

        var valueMap = rows.ToDictionary(x => BuildMonthKey(x.Year, x.Month), x => x.Value);

        return monthRange
            .Select(x => new AdminDashboardMetricPointReport(x.Label, valueMap.GetValueOrDefault(x.Key)))
            .ToList();
    }

    private async Task<List<AdminDashboardCategoryMetricReport>> BuildCustomerNationalities(CancellationToken cancellationToken)
    {
        var rows = await _context.TourRequests
            .AsNoTracking()
            .Where(x => !string.IsNullOrWhiteSpace(x.Destination))
            .Select(x => x.Destination)
            .ToListAsync(cancellationToken);

        var grouped = rows
            .GroupBy(NormalizeLocationBucket, StringComparer.OrdinalIgnoreCase)
            .Select(g => new AdminDashboardCategoryMetricReport(g.Key, g.Count()))
            .OrderByDescending(x => x.Value)
            .ThenBy(x => x.Label, StringComparer.Ordinal)
            .Take(4)
            .ToList();

        if (grouped.Count > 0)
        {
            return grouped;
        }

        var totalCustomers = await _context.Users
            .AsNoTracking()
            .CountAsync(x => !x.IsDeleted, cancellationToken);

        return [new AdminDashboardCategoryMetricReport("Unknown", totalCustomers)];
    }

    private async Task<List<AdminDashboardVisaStatusReport>> BuildVisaStatuses(CancellationToken cancellationToken)
    {
        var rows = await _context.TourRequests
            .AsNoTracking()
            .GroupBy(x => x.Status)
            .Select(g => new TourRequestStatusCountRow(g.Key, g.Count()))
            .ToListAsync(cancellationToken);

        var countMap = rows.ToDictionary(x => x.Status, x => x.Count);

        return [
            new AdminDashboardVisaStatusReport(TourStatusLabelConstants.VisaPending, countMap.GetValueOrDefault(TourRequestStatus.Pending)),
            new AdminDashboardVisaStatusReport(TourStatusLabelConstants.VisaUnderReview, countMap.GetValueOrDefault(TourRequestStatus.Cancelled)),
            new AdminDashboardVisaStatusReport(TourStatusLabelConstants.VisaApproved, countMap.GetValueOrDefault(TourRequestStatus.Approved)),
            new AdminDashboardVisaStatusReport(TourStatusLabelConstants.VisaRejected, countMap.GetValueOrDefault(TourRequestStatus.Rejected))
        ];
    }

    private async Task<List<AdminDashboardVisaDeadlineReport>> BuildUpcomingVisaDeadlines(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;

        var rows = await _context.TourRequests
            .AsNoTracking()
            .Where(x => x.Status == TourRequestStatus.Pending && x.DepartureDate >= now)
            .OrderBy(x => x.DepartureDate)
            .Take(_options.RankedItemLimit)
            .Select(x => new VisaDeadlineRow(
                x.Destination,
                x.TourInstance != null ? x.TourInstance.Title : null,
                x.DepartureDate))
            .ToListAsync(cancellationToken);

        return rows
            .Select(x => new AdminDashboardVisaDeadlineReport(
                Tour: ResolveTourDisplayName(x.TourTitle, x.Destination),
                Date: x.DepartureDate.ToString("dd MMM", DateCulture)))
            .ToList();
    }

    private async Task<AdminDashboardVisaSummaryReport> BuildVisaSummary(CancellationToken cancellationToken)
    {
        var totalApplications = await _context.TourRequests
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var approved = await _context.TourRequests
            .AsNoTracking()
            .CountAsync(x => x.Status == TourRequestStatus.Approved, cancellationToken);

        var rejected = await _context.TourRequests
            .AsNoTracking()
            .CountAsync(x => x.Status == TourRequestStatus.Rejected, cancellationToken);

        var decided = approved + rejected;
        var approvalRate = decided == 0
            ? 0m
            : Math.Round(approved * 100m / decided, 2);

        return new AdminDashboardVisaSummaryReport(
            TotalApplications: totalApplications,
            Approved: approved,
            Rejected: rejected,
            ApprovalRate: approvalRate);
    }

    private async Task<List<AdminDashboardAlertReport>> BuildAlerts(AdminDashboardStatsReport stats, CancellationToken cancellationToken)
    {
        var alerts = new List<AdminDashboardAlertReport>();

        var nearlyFullTourCount = await _context.TourInstances
            .AsNoTracking()
            .CountAsync(
                x => !x.IsDeleted
                    && x.MaxParticipation > 0
                    && x.CurrentParticipation * 100 >= x.MaxParticipation * _options.NearlyFullCancellationThreshold,
                cancellationToken);

        if (nearlyFullTourCount > 0)
        {
            alerts.Add(new AdminDashboardAlertReport(
                Text: $"{nearlyFullTourCount} tour instances are nearly full.",
                Severity: "info"));
        }

        var pendingVisaCount = await _context.TourRequests
            .AsNoTracking()
            .CountAsync(x => x.Status == TourRequestStatus.Pending, cancellationToken);

        if (pendingVisaCount > 0)
        {
            alerts.Add(new AdminDashboardAlertReport(
                Text: $"{pendingVisaCount} visa applications are pending review.",
                Severity: "warning"));
        }

        if (stats.CancellationRate >= _options.DangerCancellationRateThreshold)
        {
            alerts.Add(new AdminDashboardAlertReport(
                Text: $"Cancellation rate is elevated at {stats.CancellationRate:F1}%.",
                Severity: "danger"));
        }

        var currentMonth = StartOfCurrentMonth();
        var previousMonth = currentMonth.AddMonths(-1);

        var currentRevenue =
            //await _context.CustomerPayments
            //.AsNoTracking()
            //.Where(x => x.PaidAt >= currentMonth && x.PaidAt < currentMonth.AddMonths(1))
            //.SumAsync(x => (decimal?)x.Amount, cancellationToken) ??
            0m;

        var previousRevenue =
            //await _context.CustomerPayments
            //.AsNoTracking()
            //.Where(x => x.PaidAt >= previousMonth && x.PaidAt < currentMonth)
            //.SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 
            0m;

        if (currentRevenue >= previousRevenue)
        {
            alerts.Add(new AdminDashboardAlertReport(
                Text: "Revenue is stable or improving versus last month.",
                Severity: "success"));
        }
        else
        {
            alerts.Add(new AdminDashboardAlertReport(
                Text: "Revenue is below last month and should be monitored.",
                Severity: "warning"));
        }

        if (alerts.Count == 0)
        {
            alerts.Add(new AdminDashboardAlertReport(
                Text: "No critical operational alerts right now.",
                Severity: "info"));
        }

        return alerts;
    }

    private static List<MonthRangeItem> BuildMonthRange(int monthCount)
    {
        var firstMonth = StartOfCurrentMonth().AddMonths(-(monthCount - 1));

        return Enumerable
            .Range(0, monthCount)
            .Select(offset =>
            {
                var month = firstMonth.AddMonths(offset);
                return new MonthRangeItem(
                    Key: BuildMonthKey(month.Year, month.Month),
                    Label: month.ToString("MMM", DateCulture),
                    MonthStart: month);
            })
            .ToList();
    }

    private static DateTimeOffset StartOfCurrentMonth()
    {
        var now = DateTimeOffset.UtcNow;
        return new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
    }

    private static string BuildMonthKey(int year, int month)
    {
        return $"{year:D4}-{month:D2}";
    }

    private static string NormalizeLocationBucket(string? location)
    {
        if (string.IsNullOrWhiteSpace(location))
        {
            return "Unknown";
        }

        var segments = location.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (segments.Length == 0)
        {
            return "Unknown";
        }

        return segments[^1];
    }

    private static string ResolveTourDisplayName(string? title, string? fallback)
    {
        if (!string.IsNullOrWhiteSpace(title))
        {
            return title;
        }

        if (!string.IsNullOrWhiteSpace(fallback))
        {
            return fallback;
        }

        return "Tour";
    }

    private sealed record MonthRangeItem(string Key, string Label, DateTimeOffset MonthStart);

    private sealed record MonthlyDecimalRow(int Year, int Month, decimal Value);

    private sealed record TourTypeRevenueRow(TourType TourType, decimal Revenue);

    private sealed record LocationRevenueRow(string? Location, decimal Revenue);

    private sealed record BookingStatusCountRow(BookingStatus Status, int Count);

    private sealed record TopTourRow(string? Title, string? TourName, int Bookings, decimal Revenue);

    private sealed record TopTourSourceRow(string? Title, string? TourName, decimal Revenue);

    private sealed record TourRequestStatusCountRow(TourRequestStatus Status, int Count);

    private sealed record VisaDeadlineRow(string Destination, string? TourTitle, DateTimeOffset DepartureDate);
}
