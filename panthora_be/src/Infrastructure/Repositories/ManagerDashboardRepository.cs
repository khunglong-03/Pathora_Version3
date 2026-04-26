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

public sealed class ManagerDashboardRepository(AppDbContext context, IOptions<AdminDashboardOptions> options)
    : IManagerDashboardRepository
{
    private readonly AdminDashboardOptions _options = options.Value;
    private static readonly CultureInfo DateCulture = CultureInfo.InvariantCulture;
    private readonly AppDbContext _context = context;

    public async Task<ManagerDashboardReport> GetDashboard(Guid managerId, CancellationToken cancellationToken = default)
    {
        // Step 1: Get all TourDesigner IDs managed by this Manager
        var designerIds = await _context.TourManagerAssignments
            .AsNoTracking()
            .Where(a => a.TourManagerId == managerId
                        && a.AssignedEntityType == AssignedEntityType.TourDesigner
                        && a.AssignedUserId != null)
            .Select(a => a.AssignedUserId!.Value)
            .ToListAsync(cancellationToken);

        // Include the manager themselves so their own data is shown
        if (!designerIds.Contains(managerId))
        {
            designerIds.Add(managerId);
        }

        // Also get TourGuide IDs for staff overview
        var guideIds = await _context.TourManagerAssignments
            .AsNoTracking()
            .Where(a => a.TourManagerId == managerId
                        && a.AssignedEntityType == AssignedEntityType.TourGuide
                        && a.AssignedUserId != null)
            .Select(a => a.AssignedUserId!.Value)
            .ToListAsync(cancellationToken);

        // Step 2: Get all Tour IDs owned by those designers
        var tourIds = await _context.Tours
            .AsNoTracking()
            .Where(t => !t.IsDeleted && t.TourDesignerId != null && designerIds.Contains(t.TourDesignerId ?? Guid.Empty))
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

        // Step 3: Get all TourInstance IDs from those tours
        var tourInstanceIds = await _context.TourInstances
            .AsNoTracking()
            .Where(ti => !ti.IsDeleted && tourIds.Contains(ti.TourId))
            .Select(ti => ti.Id)
            .ToListAsync(cancellationToken);

        var stats = await BuildStats(tourIds, tourInstanceIds, designerIds, guideIds, cancellationToken);
        var instancesByStatus = await BuildTourInstancesByStatus(tourInstanceIds, cancellationToken);
        var bookingTrend = await BuildBookingTrend(tourInstanceIds, cancellationToken);
        var bookingStatusDist = await BuildBookingStatusDistribution(tourInstanceIds, cancellationToken);
        var topTours = await BuildTopTours(tourInstanceIds, cancellationToken);
        var upcomingDepartures = await BuildUpcomingDepartures(tourIds, cancellationToken);
        var recentBookings = await BuildRecentBookings(tourInstanceIds, cancellationToken);
        var staff = await BuildStaffOverview(designerIds, guideIds, cancellationToken);

        return new ManagerDashboardReport(
            Stats: stats,
            TourInstancesByStatus: instancesByStatus,
            BookingTrend: bookingTrend,
            BookingStatusDistribution: bookingStatusDist,
            TopTours: topTours,
            UpcomingDepartures: upcomingDepartures,
            RecentBookings: recentBookings,
            Staff: staff);
    }

    private async Task<ManagerDashboardStatsReport> BuildStats(
        List<Guid> tourIds, List<Guid> tourInstanceIds,
        List<Guid> designerIds, List<Guid> guideIds,
        CancellationToken ct)
    {
        var totalTours = tourIds.Count;

        var totalTourInstances = tourInstanceIds.Count;

        var activeTourInstances = await _context.TourInstances
            .AsNoTracking()
            .CountAsync(ti => tourInstanceIds.Contains(ti.Id)
                              && !ti.IsDeleted
                              && ti.Status != TourInstanceStatus.Cancelled
                              && ti.Status != TourInstanceStatus.Completed, ct);

        var totalBookings = await _context.Bookings
            .AsNoTracking()
            .CountAsync(b => tourInstanceIds.Contains(b.TourInstanceId), ct);

        var now = DateTimeOffset.UtcNow;
        var upcomingDepartures = await _context.TourInstances
            .AsNoTracking()
            .CountAsync(ti => tourInstanceIds.Contains(ti.Id)
                              && !ti.IsDeleted
                              && ti.StartDate > now
                              && ti.Status != TourInstanceStatus.Cancelled, ct);

        var totalStaff = designerIds.Count + guideIds.Count;

        return new ManagerDashboardStatsReport(
            TotalTours: totalTours,
            TotalTourInstances: totalTourInstances,
            ActiveTourInstances: activeTourInstances,
            TotalBookings: totalBookings,
            UpcomingDepartures: upcomingDepartures,
            TotalStaff: totalStaff);
    }

    private async Task<List<ManagerDashboardCategoryMetric>> BuildTourInstancesByStatus(
        List<Guid> tourInstanceIds, CancellationToken ct)
    {
        var rows = await _context.TourInstances
            .AsNoTracking()
            .Where(ti => tourInstanceIds.Contains(ti.Id) && !ti.IsDeleted)
            .GroupBy(ti => ti.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var countMap = rows.ToDictionary(x => x.Status, x => x.Count);

        return
        [
            new ManagerDashboardCategoryMetric("Available", countMap.GetValueOrDefault(TourInstanceStatus.Available)),
            new ManagerDashboardCategoryMetric("Confirmed", countMap.GetValueOrDefault(TourInstanceStatus.Confirmed)),
            new ManagerDashboardCategoryMetric("InProgress", countMap.GetValueOrDefault(TourInstanceStatus.InProgress)),
            new ManagerDashboardCategoryMetric("SoldOut", countMap.GetValueOrDefault(TourInstanceStatus.SoldOut)),
            new ManagerDashboardCategoryMetric("Completed", countMap.GetValueOrDefault(TourInstanceStatus.Completed)),
            new ManagerDashboardCategoryMetric("Cancelled", countMap.GetValueOrDefault(TourInstanceStatus.Cancelled)),
        ];
    }

    private async Task<List<ManagerDashboardMetricPoint>> BuildBookingTrend(
        List<Guid> tourInstanceIds, CancellationToken ct)
    {
        var monthRange = BuildMonthRange(_options.DashboardMonthWindow);
        var start = monthRange[0].MonthStart;

        var rows = await _context.Bookings
            .AsNoTracking()
            .Where(b => tourInstanceIds.Contains(b.TourInstanceId) && b.BookingDate >= start)
            .GroupBy(b => new { b.BookingDate.Year, b.BookingDate.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
            .ToListAsync(ct);

        var valueMap = rows.ToDictionary(x => BuildMonthKey(x.Year, x.Month), x => (decimal)x.Count);

        return monthRange
            .Select(x => new ManagerDashboardMetricPoint(x.Label, valueMap.GetValueOrDefault(x.Key)))
            .ToList();
    }

    private async Task<List<ManagerDashboardCategoryMetric>> BuildBookingStatusDistribution(
        List<Guid> tourInstanceIds, CancellationToken ct)
    {
        var rows = await _context.Bookings
            .AsNoTracking()
            .Where(b => tourInstanceIds.Contains(b.TourInstanceId))
            .GroupBy(b => b.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var countMap = rows.ToDictionary(x => x.Status, x => x.Count);

        return
        [
            new ManagerDashboardCategoryMetric(TourStatusLabelConstants.Pending, countMap.GetValueOrDefault(BookingStatus.Pending)),
            new ManagerDashboardCategoryMetric(TourStatusLabelConstants.Confirmed, countMap.GetValueOrDefault(BookingStatus.Confirmed)),
            new ManagerDashboardCategoryMetric(TourStatusLabelConstants.Deposited, countMap.GetValueOrDefault(BookingStatus.Deposited)),
            new ManagerDashboardCategoryMetric(TourStatusLabelConstants.Paid, countMap.GetValueOrDefault(BookingStatus.Paid)),
            new ManagerDashboardCategoryMetric(TourStatusLabelConstants.Completed, countMap.GetValueOrDefault(BookingStatus.Completed)),
            new ManagerDashboardCategoryMetric(TourStatusLabelConstants.Cancelled, countMap.GetValueOrDefault(BookingStatus.Cancelled)),
        ];
    }

    private async Task<List<ManagerDashboardTopTour>> BuildTopTours(
        List<Guid> tourInstanceIds, CancellationToken ct)
    {
        var sourceRows = await _context.Bookings
            .AsNoTracking()
            .Where(b => tourInstanceIds.Contains(b.TourInstanceId) && b.Status != BookingStatus.Cancelled)
            .OrderByDescending(b => b.CreatedOnUtc)
            .Take(5000)
            .Select(b => new { b.TourInstance.TourName, b.TotalPrice })
            .ToListAsync(ct);

        return sourceRows
            .GroupBy(x => x.TourName)
            .Select(g => new ManagerDashboardTopTour(g.Key ?? "Tour", g.Count(), g.Sum(x => x.TotalPrice)))
            .OrderByDescending(x => x.Revenue)
            .ThenByDescending(x => x.Bookings)
            .Take(_options.RankedItemLimit)
            .ToList();
    }

    private async Task<List<ManagerUpcomingDeparture>> BuildUpcomingDepartures(
        List<Guid> tourIds, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;

        return await _context.TourInstances
            .AsNoTracking()
            .Where(ti => tourIds.Contains(ti.TourId)
                         && !ti.IsDeleted
                         && ti.StartDate > now
                         && ti.Status != TourInstanceStatus.Cancelled)
            .OrderBy(ti => ti.StartDate)
            .Take(_options.RankedItemLimit)
            .Select(ti => new ManagerUpcomingDeparture(
                ti.Id,
                ti.Title,
                ti.StartDate,
                ti.CurrentParticipation,
                ti.MaxParticipation,
                ti.Status.ToString()))
            .ToListAsync(ct);
    }

    private async Task<List<ManagerRecentBooking>> BuildRecentBookings(
        List<Guid> tourInstanceIds, CancellationToken ct)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Where(b => tourInstanceIds.Contains(b.TourInstanceId))
            .OrderByDescending(b => b.BookingDate)
            .Take(_options.RankedItemLimit)
            .Select(b => new ManagerRecentBooking(
                b.Id,
                b.CustomerName ?? "Guest",
                b.TourInstance.TourName ?? "Tour",
                b.TotalPrice,
                b.Status.ToString(),
                b.BookingDate))
            .ToListAsync(ct);
    }

    private async Task<List<ManagerStaffMember>> BuildStaffOverview(
        List<Guid> designerIds, List<Guid> guideIds, CancellationToken ct)
    {
        var allStaffIds = designerIds.Concat(guideIds).Distinct().ToList();

        if (allStaffIds.Count == 0)
            return [];

        var users = await _context.Users
            .AsNoTracking()
            .Where(u => allStaffIds.Contains(u.Id) && !u.IsDeleted)
            .Select(u => new { u.Id, u.FullName, u.Email })
            .ToListAsync(ct);

        // Count tours per designer
        var tourCounts = await _context.Tours
            .AsNoTracking()
            .Where(t => !t.IsDeleted && t.TourDesignerId != null && designerIds.Contains(t.TourDesignerId ?? Guid.Empty))
            .GroupBy(t => t.TourDesignerId!.Value)
            .Select(g => new { DesignerId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var tourCountMap = tourCounts.ToDictionary(x => x.DesignerId, x => x.Count);
        var designerSet = designerIds.ToHashSet();

        return users
            .Select(u => new ManagerStaffMember(
                u.Id,
                u.FullName ?? u.Email,
                u.Email,
                designerSet.Contains(u.Id) ? "TourDesigner" : "TourGuide",
                tourCountMap.GetValueOrDefault(u.Id)))
            .OrderBy(s => s.Role)
            .ThenBy(s => s.FullName)
            .ToList();
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
                    BuildMonthKey(month.Year, month.Month),
                    month.ToString("MMM", DateCulture),
                    month);
            })
            .ToList();
    }

    private static DateTimeOffset StartOfCurrentMonth()
    {
        var now = DateTimeOffset.UtcNow;
        return new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
    }

    private static string BuildMonthKey(int year, int month) => $"{year:D4}-{month:D2}";

    private sealed record MonthRangeItem(string Key, string Label, DateTimeOffset MonthStart);
}
