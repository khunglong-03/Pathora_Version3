using System.Globalization;

using Domain.Common.Repositories;
using Domain.Enums;
using Domain.Reports;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class AdminOverviewRepository(AppDbContext context) : IAdminOverviewRepository
{
    private static readonly CultureInfo DateCulture = CultureInfo.InvariantCulture;
    private readonly AppDbContext _context = context;

    public async Task<AdminOverviewReport> GetOverview(Guid? managerId = null, CancellationToken cancellationToken = default)
    {
        List<Guid>? tourInstanceIds = null;
        List<Guid>? classificationIds = null;

        if (managerId.HasValue)
        {
            // Step 1: Get all TourOperator IDs managed by this Manager
            var designerIds = await _context.TourManagerAssignments
                .AsNoTracking()
                .Where(a => a.TourManagerId == managerId.Value
                            && a.AssignedEntityType == AssignedEntityType.TourOperator
                            && a.AssignedUserId != null)
                .Select(a => a.AssignedUserId!.Value)
                .ToListAsync(cancellationToken);

            // Include the manager themselves so their own data is shown
            if (!designerIds.Contains(managerId.Value))
            {
                designerIds.Add(managerId.Value);
            }

            // Step 2: Get all Tour IDs owned by those designers
            var tourIds = await _context.Tours
                .AsNoTracking()
                .Where(t => !t.IsDeleted && t.TourOperatorId != null && designerIds.Contains(t.TourOperatorId ?? Guid.Empty))
                .Select(t => t.Id)
                .ToListAsync(cancellationToken);

            // Step 3: Get all TourInstance IDs from those tours
            tourInstanceIds = await _context.TourInstances
                .AsNoTracking()
                .Where(ti => !ti.IsDeleted && tourIds.Contains(ti.TourId))
                .Select(ti => ti.Id)
                .ToListAsync(cancellationToken);

            // Step 4: Get Classification IDs linked to those tours
            classificationIds = await _context.Tours
                .AsNoTracking()
                .Where(t => tourIds.Contains(t.Id))
                .SelectMany(t => t.Classifications.Select(c => c.Id))
                .Distinct()
                .ToListAsync(cancellationToken);
        }

        var stats = await BuildDashboardStats(tourInstanceIds, cancellationToken);
        var customers = await BuildCustomers(tourInstanceIds, cancellationToken);
        var insurances = await BuildInsurances(classificationIds, cancellationToken);
        var visaApplications = await BuildVisaApplications(tourInstanceIds, cancellationToken);
        var payments = await BuildPayments(tourInstanceIds, cancellationToken);
        var paymentStats = await BuildPaymentStats(tourInstanceIds, cancellationToken);

        return new AdminOverviewReport(
            stats,
            customers,
            payments,
            paymentStats,
            insurances,
            visaApplications);
    }

    private async Task<AdminDashboardStatsReport> BuildDashboardStats(List<Guid>? tourInstanceIds, CancellationToken cancellationToken)
    {
        var totalRevenue = 0m;

        var bookingsQuery = _context.Bookings.AsNoTracking();
        var tourInstancesQuery = _context.TourInstances.AsNoTracking();
        var tourRequestsQuery = _context.TourRequests.AsNoTracking();

        if (tourInstanceIds != null)
        {
            bookingsQuery = bookingsQuery.Where(x => tourInstanceIds.Contains(x.TourInstanceId));
            tourInstancesQuery = tourInstancesQuery.Where(x => tourInstanceIds.Contains(x.Id));
            tourRequestsQuery = tourRequestsQuery.Where(x => x.TourInstanceId != null && tourInstanceIds.Contains(x.TourInstanceId.Value));
        }

        var totalBookings = await bookingsQuery.CountAsync(cancellationToken);

        var cancelledBookings = await bookingsQuery.CountAsync(x => x.Status == BookingStatus.Cancelled, cancellationToken);

        var activeTours = await tourInstancesQuery.CountAsync(
            x => !x.IsDeleted
                && x.Status != TourInstanceStatus.Cancelled
                && x.Status != TourInstanceStatus.Completed,
            cancellationToken);

        int totalCustomers;
        if (tourInstanceIds != null)
        {
            totalCustomers = await bookingsQuery
                .Where(x => x.UserId.HasValue)
                .Select(x => x.UserId!.Value)
                .Distinct()
                .CountAsync(cancellationToken);
        }
        else
        {
            totalCustomers = await _context.Users
                .AsNoTracking()
                .CountAsync(x => !x.IsDeleted, cancellationToken);
        }

        var approvedVisaCount = await tourRequestsQuery.CountAsync(x => x.Status == TourRequestStatus.Approved, cancellationToken);

        var finalizedVisaCount = await tourRequestsQuery.CountAsync(
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

    private async Task<List<AdminCustomerReport>> BuildCustomers(List<Guid>? tourInstanceIds, CancellationToken cancellationToken)
    {
        var bookingsQuery = _context.Bookings.AsNoTracking().Where(x => x.UserId.HasValue);
        if (tourInstanceIds != null)
        {
            bookingsQuery = bookingsQuery.Where(x => tourInstanceIds.Contains(x.TourInstanceId));
        }

        var bookingSummaries = await bookingsQuery
            .GroupBy(x => x.UserId!.Value)
            .Select(g => new CustomerBookingSummary(
                g.Key,
                g.Count(),
                g.Sum(x => x.TotalPrice),
                g.Max(x => x.BookingDate))).ToListAsync(cancellationToken);

        var bookingSummaryMap = bookingSummaries.ToDictionary(x => x.UserId);

        var usersQuery = _context.Users.AsNoTracking().Where(x => !x.IsDeleted);
        if (tourInstanceIds != null)
        {
            var userIds = bookingSummaries.Select(x => x.UserId).ToList();
            usersQuery = usersQuery.Where(x => userIds.Contains(x.Id));
        }

        var users = await usersQuery
            .OrderByDescending(x => x.CreatedOnUtc)
            .Take(200)
            .Select(x => new UserSummary(
                x.Id,
                x.FullName,
                x.Username,
                x.Email,
                x.PhoneNumber,
                x.Status))
            .ToListAsync(cancellationToken);

        return users
            .Select(user =>
            {
                bookingSummaryMap.TryGetValue(user.Id, out var summary);

                var displayName = string.IsNullOrWhiteSpace(user.FullName)
                    ? user.Username
                    : user.FullName;

                return new AdminCustomerReport(
                    PrefixId("CUS", user.Id),
                    displayName,
                    user.Email,
                    user.PhoneNumber ?? "-",
                    "Unknown",
                    summary?.TotalBookings ?? 0,
                    summary?.TotalSpent ?? 0m,
                    MapUserStatus(user.Status),
                    summary is null
                        ? "-"
                        : FormatDate(summary.LastBookingDate));
            })
            .ToList();
    }

    private async Task<List<AdminPaymentReport>> BuildPayments(List<Guid>? tourInstanceIds, CancellationToken cancellationToken)
    {
        var paymentsQuery = _context.PaymentTransactions.AsNoTracking();
        if (tourInstanceIds != null)
        {
            paymentsQuery = paymentsQuery.Where(x => tourInstanceIds.Contains(x.Booking.TourInstanceId));
        }

        var paymentRows = await paymentsQuery
            .Include(x => x.Booking)
                .ThenInclude(b => b.TourInstance)
            .OrderByDescending(x => x.CreatedAt)
            .Take(300)
            .Select(x => new PaymentRow(
                x.Id,
                x.BookingId,
                x.TransactionCode,
                x.Amount,
                x.PaidAmount ?? 0,
                x.Status,
                x.Type,
                x.PaymentMethod,
                x.CreatedAt,
                x.PaidAt,
                x.Booking.CustomerName,
                x.Booking.TourInstance != null ? x.Booking.TourInstance.TourName : "Unknown Tour",
                x.Booking.TourInstance != null ? x.Booking.TourInstance.Title : null))
            .ToListAsync(cancellationToken);

        return paymentRows
            .Select(row => new AdminPaymentReport(
                Id: PrefixId("PAY", row.Id),
                Booking: ResolveBookingName(row.TourName, row.TourTitle),
                Customer: row.CustomerName,
                Method: row.PaymentMethod.ToString(),
                Amount: row.PaidAmount > 0 ? row.PaidAmount : row.Amount,
                Status: MapTransactionStatus(row.Status, row.Type),
                Date: FormatDate(row.PaidAt ?? row.CreatedAt)))
            .ToList();
    }

    private static string MapTransactionStatus(TransactionStatus status, TransactionType type)
    {
        if (type == TransactionType.Refund)
        {
            return "refunded";
        }

        return status switch
        {
            TransactionStatus.Completed => "completed",
            TransactionStatus.Pending => "pending",
            TransactionStatus.Processing => "pending",
            TransactionStatus.Failed => "failed",
            TransactionStatus.Cancelled => "cancelled",
            TransactionStatus.Refunded => "refunded",
            _ => "pending"
        };
    }

    private async Task<AdminPaymentStatsReport> BuildPaymentStats(List<Guid>? tourInstanceIds, CancellationToken cancellationToken)
    {
        var query = _context.PaymentTransactions.AsNoTracking();
        if (tourInstanceIds != null)
        {
            query = query.Where(x => tourInstanceIds.Contains(x.Booking.TourInstanceId));
        }

        var totalRevenue = await query
            .Where(x => x.Status == TransactionStatus.Completed && x.Type != TransactionType.Refund)
            .SumAsync(x => x.PaidAmount ?? x.Amount, cancellationToken);

        var pendingAmount = await query
            .Where(x => x.Status == TransactionStatus.Pending || x.Status == TransactionStatus.Processing)
            .SumAsync(x => x.PaidAmount ?? x.Amount, cancellationToken);

        var completedCount = await query.CountAsync(x => x.Status == TransactionStatus.Completed && x.Type != TransactionType.Refund, cancellationToken);
        var pendingCount = await query.CountAsync(
            x => x.Status == TransactionStatus.Pending || x.Status == TransactionStatus.Processing,
            cancellationToken);
        var refundedCount = await query.CountAsync(
            x => x.Status == TransactionStatus.Refunded || x.Type == TransactionType.Refund,
            cancellationToken);

        return new AdminPaymentStatsReport(
            totalRevenue,
            pendingAmount,
            completedCount,
            pendingCount,
            refundedCount);
    }

    private sealed record PaymentRow(
        Guid Id,
        Guid BookingId,
        string TransactionCode,
        decimal Amount,
        decimal PaidAmount,
        TransactionStatus Status,
        TransactionType Type,
        PaymentMethod PaymentMethod,
        DateTimeOffset CreatedAt,
        DateTimeOffset? PaidAt,
        string CustomerName,
        string TourName,
        string? TourTitle);

    private async Task<List<AdminInsuranceReport>> BuildInsurances(List<Guid>? classificationIds, CancellationToken cancellationToken)
    {
        var insurancesQuery = _context.TourInsurances.AsNoTracking();
        if (classificationIds != null)
        {
            insurancesQuery = insurancesQuery.Where(x => classificationIds.Contains(x.TourClassificationId));
        }

        var insuranceRows = await insurancesQuery
            .Include(x => x.TourClassification)
            .OrderByDescending(x => x.CreatedOnUtc)
            .Take(200)
            .Select(x => new InsuranceRow(
                x.Id,
                x.TourClassification.Name,
                x.InsuranceProvider,
                x.InsuranceType,
                x.CoverageAmount,
                x.CoverageFee,
                x.IsOptional,
                x.CreatedOnUtc,
                x.LastModifiedOnUtc))
            .ToListAsync(cancellationToken);

        return insuranceRows
            .Select(row => new AdminInsuranceReport(
                PrefixId("INS", row.Id),
                row.ClassificationName,
                row.Provider,
                row.InsuranceType.ToString(),
                FormatMoney(row.CoverageAmount),
                row.CoverageFee,
                row.IsOptional ? "claimed" : "active",
                FormatDate(row.CreatedOnUtc),
                row.LastModifiedOnUtc.HasValue
                    ? FormatDate(row.LastModifiedOnUtc.Value)
                    : "-"))
            .ToList();
    }

    private async Task<List<AdminVisaApplicationReport>> BuildVisaApplications(List<Guid>? tourInstanceIds, CancellationToken cancellationToken)
    {
        var visaQuery = _context.VisaApplications.AsNoTracking();
        if (tourInstanceIds != null)
        {
            visaQuery = visaQuery.Where(x => x.BookingParticipant != null
                                             && x.BookingParticipant.Booking != null
                                             && tourInstanceIds.Contains(x.BookingParticipant.Booking.TourInstanceId));
        }

        var visaRows = await visaQuery
            .Include(x => x.BookingParticipant)
            .Include(x => x.Passport)
            .OrderByDescending(x => x.CreatedOnUtc)
            .Take(200)
            .Select(x => new VisaApplicationRow(
                x.Id,
                x.BookingParticipant != null ? x.BookingParticipant.FullName : "Unknown",
                x.DestinationCountry,
                x.Status,
                x.CreatedOnUtc,
                x.LastModifiedOnUtc,
                x.BookingParticipant != null ? (Guid?)x.BookingParticipant.BookingId : null,
                x.Passport != null ? x.Passport.PassportNumber : "-",
                x.BookingParticipant != null && x.BookingParticipant.Booking != null && x.BookingParticipant.Booking.TourInstance != null
                    ? (TourType?)x.BookingParticipant.Booking.TourInstance.InstanceType
                    : null))
            .ToListAsync(cancellationToken);

        return visaRows
            .Select(row => new AdminVisaApplicationReport(
                row.Id.ToString(), // Do not prefix ID, keep Guid for actions
                row.BookingId.HasValue ? PrefixId("ORD", row.BookingId.Value) : "No Order",
                row.CustomerName,
                row.PassportNumber,
                row.Destination,
                row.TourType.HasValue ? (row.TourType.Value == TourType.Private ? "Private Tour" : "Public Tour") : "Unknown",
                MapVisaStatus(row.Status),
                FormatDate(row.CreatedOnUtc),
                row.ReviewedAt.HasValue
                    ? FormatDate(row.ReviewedAt.Value)
                    : "-"))
            .ToList();
    }

    private static string PrefixId(string prefix, Guid id)
    {
        var shortId = id.ToString("N")[..8].ToUpperInvariant();
        return $"{prefix}-{shortId}";
    }

    private static string ResolveBookingName(string? tourName, string? title)
    {
        if (!string.IsNullOrWhiteSpace(title))
        {
            return title;
        }

        return !string.IsNullOrWhiteSpace(tourName) ? tourName : "Tour Booking";
    }

    private static string FormatDate(DateTimeOffset value)
    {
        return value.ToString("MMM dd, yyyy", DateCulture);
    }

    private static string FormatMoney(decimal value)
    {
        return $"${value:N0}";
    }

    private static string MapUserStatus(UserStatus status) =>
        status switch
        {
            UserStatus.Active => "active",
            UserStatus.Inactive => "inactive",
            UserStatus.Banned => "inactive",
            _ => "inactive"
        };

    private static string MapVisaStatus(VisaStatus status)
    {
        return status switch
        {
            VisaStatus.Pending => "pending",
            VisaStatus.Processing => "under_review",
            VisaStatus.Approved => "approved",
            VisaStatus.Rejected => "rejected",
            VisaStatus.Cancelled => "rejected",
            _ => "pending"
        };
    }

    private sealed record CustomerBookingSummary(
        Guid UserId,
        int TotalBookings,
        decimal TotalSpent,
        DateTimeOffset LastBookingDate);

    private sealed record UserSummary(
        Guid Id,
        string? FullName,
        string Username,
        string Email,
        string? PhoneNumber,
        UserStatus Status);

    private sealed record CompletedPaymentRow(
        Guid Id,
        Guid BookingId,
        decimal Amount,
        DateTimeOffset PaidAt,
        PaymentMethod PaymentMethod,
        BookingStatus BookingStatus,
        string CustomerName,
        string TourName,
        string TourTitle);

    private sealed record PendingBookingRow(
        Guid Id,
        decimal TotalPrice,
        DateTimeOffset BookingDate,
        PaymentMethod PaymentMethod,
        BookingStatus Status,
        string CustomerName,
        string TourName,
        string TourTitle);

    private sealed record InsuranceRow(
        Guid Id,
        string ClassificationName,
        string Provider,
        InsuranceType InsuranceType,
        decimal CoverageAmount,
        decimal CoverageFee,
        bool IsOptional,
        DateTimeOffset CreatedOnUtc,
        DateTimeOffset? LastModifiedOnUtc);

    private sealed record VisaApplicationRow(
        Guid Id,
        string CustomerName,
        string Destination,
        VisaStatus Status,
        DateTimeOffset CreatedOnUtc,
        DateTimeOffset? ReviewedAt,
        Guid? BookingId,
        string PassportNumber,
        TourType? TourType);
}
