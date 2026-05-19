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

    public async Task<AdminOverviewReport> GetOverview(CancellationToken cancellationToken = default)
    {
        var stats = await BuildDashboardStats(cancellationToken);
        var customers = await BuildCustomers(cancellationToken);
        var insurances = await BuildInsurances(cancellationToken);
        var visaApplications = await BuildVisaApplications(cancellationToken);

        var payments = await BuildPayments(cancellationToken);

        return new AdminOverviewReport(
            stats, 
            customers, 
            payments, 
            insurances, 
            visaApplications);
    }

    private async Task<AdminDashboardStatsReport> BuildDashboardStats(CancellationToken cancellationToken)
    {
        var totalRevenue =
            //await _context.CustomerPayments
            //.AsNoTracking()
            //.SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 
            0m;

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

    private async Task<List<AdminCustomerReport>> BuildCustomers(CancellationToken cancellationToken)
    {
        var bookingSummaries = await _context.Bookings
            .AsNoTracking()
            .Where(x => x.UserId.HasValue)
            .GroupBy(x => x.UserId!.Value)
            .Select(g => new CustomerBookingSummary(
                g.Key,
                g.Count(),
                g.Sum(x => x.TotalPrice),
                g.Max(x => x.BookingDate))).ToListAsync(cancellationToken);

        var bookingSummaryMap = bookingSummaries.ToDictionary(x => x.UserId);

        var users = await _context.Users
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
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

    private async Task<List<AdminPaymentReport>> BuildPayments(CancellationToken cancellationToken)
    {
        var paymentRows = await _context.PaymentTransactions
            .AsNoTracking()
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
                Status: MapTransactionStatus(row.Status),
                Date: FormatDate(row.PaidAt ?? row.CreatedAt)))
            .ToList();
    }

    private static string MapTransactionStatus(TransactionStatus status)
    {
        return status switch
        {
            TransactionStatus.Completed => "completed",
            TransactionStatus.Pending => "pending",
            TransactionStatus.Processing => "pending",
            TransactionStatus.Failed => "refunded",
            TransactionStatus.Cancelled => "refunded",
            TransactionStatus.Refunded => "refunded",
            _ => "pending"
        };
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

    private async Task<List<AdminInsuranceReport>> BuildInsurances(CancellationToken cancellationToken)
    {
        var insuranceRows = await _context.TourInsurances
            .AsNoTracking()
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

    private async Task<List<AdminVisaApplicationReport>> BuildVisaApplications(CancellationToken cancellationToken)
    {
        var visaRows = await _context.VisaApplications
            .AsNoTracking()
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
