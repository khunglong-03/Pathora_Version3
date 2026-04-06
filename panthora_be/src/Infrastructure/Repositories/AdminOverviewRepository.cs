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
        var payments = new List<AdminPaymentReport>();
        //await BuildPayments(cancellationToken);
        var insurances = await BuildInsurances(cancellationToken);
        var visaApplications = await BuildVisaApplications(cancellationToken);

        return new AdminOverviewReport(stats, customers, payments, insurances, visaApplications);
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
                UserId: g.Key,
                TotalBookings: g.Count(),
                TotalSpent: g.Sum(x => x.TotalPrice),
                LastBookingDate: g.Max(x => x.BookingDate)))
            .ToListAsync(cancellationToken);

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
                    Id: PrefixId("CUS", user.Id),
                    Name: displayName,
                    Email: user.Email,
                    Phone: user.PhoneNumber ?? "-",
                    Nationality: "Unknown",
                    TotalBookings: summary?.TotalBookings ?? 0,
                    TotalSpent: summary?.TotalSpent ?? 0m,
                    Status: MapUserStatus(user.Status),
                    LastBooking: summary is null
                        ? "-"
                        : FormatDate(summary.LastBookingDate));
            })
            .ToList();
    }

    //private async Task<List<AdminPaymentReport>> BuildPayments(CancellationToken cancellationToken)
    //{
    //    var completedPaymentRows = await _context.Payments
    //        .AsNoTracking()
    //        .Include(x => x.BookingId)
    //        .OrderByDescending(x => x.TransactionTimestamp)
    //        .Take(300)
    //        .Select(x => new CompletedPaymentRow(
    //            x.Id,
    //            x.BookingId,
    //            x.Amount,
    //            x.PaidAt,
    //            x.PaymentMethod,
    //            x.Booking.Status,
    //            x.Booking.CustomerName,
    //            x.Booking.TourInstance.TourName,
    //            x.Booking.TourInstance.Title))
    //        .ToListAsync(cancellationToken);

    //    var completedPayments = completedPaymentRows
    //        .Select(row => new AdminPaymentReport(
    //            Id: PrefixId("PAY", row.Id),
    //            Booking: ResolveBookingName(row.TourName, row.TourTitle),
    //            Customer: row.CustomerName,
    //            Method: row.PaymentMethod.ToString(),
    //            Amount: row.Amount,
    //            Status: row.BookingStatus == BookingStatus.Cancelled ? "refunded" : "completed",
    //            Date: FormatDate(row.PaidAt)))
    //        .ToList();

    //    var paidByBookingMap = completedPaymentRows
    //        .GroupBy(x => x.BookingId)
    //        .ToDictionary(x => x.Key, x => x.Sum(row => row.Amount));

    //    var bookingRows = await _context.Bookings
    //        .AsNoTracking()
    //        .Include(x => x.TourInstance)
    //        .OrderByDescending(x => x.BookingDate)
    //        .Take(300)
    //        .Select(x => new PendingBookingRow(
    //            x.Id,
    //            x.TotalPrice,
    //            x.BookingDate,
    //            x.PaymentMethod,
    //            x.Status,
    //            x.CustomerName,
    //            x.TourInstance.TourName,
    //            x.TourInstance.Title))
    //        .ToListAsync(cancellationToken);

    //    var pendingPayments = new List<AdminPaymentReport>();
    //    foreach (var booking in bookingRows)
    //    {
    //        if (booking.Status == BookingStatus.Cancelled)
    //        {
    //            continue;
    //        }

    //        paidByBookingMap.TryGetValue(booking.Id, out var paidAmount);
    //        var remainingAmount = booking.TotalPrice - paidAmount;
    //        if (remainingAmount <= 0)
    //        {
    //            continue;
    //        }

    //        pendingPayments.Add(new AdminPaymentReport(
    //            Id: PrefixId("PENDING", booking.Id),
    //            Booking: ResolveBookingName(booking.TourName, booking.TourTitle),
    //            Customer: booking.CustomerName,
    //            Method: booking.PaymentMethod.ToString(),
    //            Amount: remainingAmount,
    //            Status: "pending",
    //            Date: FormatDate(booking.BookingDate)));
    //    }

    //    return completedPayments
    //        .Concat(pendingPayments)
    //        .Take(300)
    //        .ToList();
    //}

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
                Id: PrefixId("INS", row.Id),
                Booking: row.ClassificationName,
                Customer: row.Provider,
                Type: row.InsuranceType.ToString(),
                Coverage: FormatMoney(row.CoverageAmount),
                Premium: row.CoverageFee,
                Status: row.IsOptional ? "claimed" : "active",
                StartDate: FormatDate(row.CreatedOnUtc),
                EndDate: row.LastModifiedOnUtc.HasValue
                    ? FormatDate(row.LastModifiedOnUtc.Value)
                    : "-"))
            .ToList();
    }

    private async Task<List<AdminVisaApplicationReport>> BuildVisaApplications(CancellationToken cancellationToken)
    {
        var visaRows = await _context.TourRequests
            .AsNoTracking()
            .Include(x => x.TourInstance)
            .OrderByDescending(x => x.CreatedOnUtc)
            .Take(200)
            .Select(x => new VisaApplicationRow(
                x.Id,
                x.CustomerName,
                x.Destination,
                x.Status,
                x.CreatedOnUtc,
                x.ReviewedAt,
                x.TourInstance != null ? x.TourInstance.Title : null))
            .ToListAsync(cancellationToken);

        return visaRows
            .Select(row => new AdminVisaApplicationReport(
                Id: PrefixId("VISA", row.Id),
                Booking: string.IsNullOrWhiteSpace(row.TourInstanceTitle)
                    ? row.Destination
                    : row.TourInstanceTitle,
                Applicant: row.CustomerName,
                Passport: "-",
                Country: row.Destination,
                Type: "Tourist",
                Status: MapVisaStatus(row.Status),
                SubmittedDate: FormatDate(row.CreatedOnUtc),
                DecisionDate: row.ReviewedAt.HasValue
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

        if (!string.IsNullOrWhiteSpace(tourName))
        {
            return tourName;
        }

        return "Tour Booking";
    }

    private static string FormatDate(DateTimeOffset value)
    {
        return value.ToString("MMM dd, yyyy", DateCulture);
    }

    private static string FormatMoney(decimal value)
    {
        return $"${value:N0}";
    }

    private static string MapUserStatus(UserStatus status)
    {
        return status switch
        {
            UserStatus.Active => "active",
            UserStatus.Inactive => "inactive",
            UserStatus.Banned => "inactive",
            _ => "inactive"
        };
    }

    private static string MapVisaStatus(TourRequestStatus status)
    {
        return status switch
        {
            TourRequestStatus.Pending => "pending",
            TourRequestStatus.Approved => "approved",
            TourRequestStatus.Rejected => "rejected",
            TourRequestStatus.Cancelled => "under_review",
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
        TourRequestStatus Status,
        DateTimeOffset CreatedOnUtc,
        DateTimeOffset? ReviewedAt,
        string? TourInstanceTitle);
}
