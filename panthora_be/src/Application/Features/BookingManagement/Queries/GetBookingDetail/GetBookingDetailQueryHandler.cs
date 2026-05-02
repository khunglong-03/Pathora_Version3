using Application.Common.Constant;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.BookingManagement.Queries.GetBookingDetail;

public class GetBookingDetailQueryHandler(
    IBookingRepository bookingRepository,
    Application.Common.Interfaces.ICurrentUser currentUser) : IQueryHandler<GetBookingDetailQuery, ErrorOr<BookingDetailDto>>
{
    public async Task<ErrorOr<BookingDetailDto>> Handle(GetBookingDetailQuery request, CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdWithDetailsAsync(request.BookingId, cancellationToken);

        if (booking == null)
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, "Booking not found");

        var currentUserId = currentUser.Id;
        if (!currentUser.IsInRole(Application.Common.Constant.RoleConstants.Admin) && (!currentUserId.HasValue || currentUserId.Value.ToString() != booking.UserId?.ToString()))
        {
            return Error.Forbidden("Booking.Forbidden", "You do not have access to this booking.");
        }

        var paidAmount = booking.PaymentTransactions
            .Where(t => t.Status == Domain.Enums.TransactionStatus.Completed)
            .Sum(t => t.PaidAmount ?? t.Amount);

        // Include VisaServiceFeeTotal inside TotalPrice has been handled in booking.AddVisaServiceFee.
        var remainingBalance = Math.Max(0, booking.TotalPrice - paidAmount);

        var pendingTransactions = booking.PaymentTransactions
            .Where(t => t.Status == Domain.Enums.TransactionStatus.Pending)
            .OrderByDescending(t => t.CreatedOnUtc)
            .ToList();

        var durationDays = booking.TourInstance?.EndDate.Subtract(booking.TourInstance.StartDate).Days + 1 ?? 1;

        string paymentStatusStr = booking.Status switch
        {
            Domain.Enums.BookingStatus.Paid => "paid",
            Domain.Enums.BookingStatus.Completed => "paid",
            Domain.Enums.BookingStatus.Deposited => "partial",
            _ => paidAmount > 0 ? (paidAmount >= booking.TotalPrice ? "paid" : "partial") : "unpaid"
        };

        string statusStr = booking.Status switch
        {
            Domain.Enums.BookingStatus.Pending => "pending",
            Domain.Enums.BookingStatus.Confirmed => "confirmed",
            Domain.Enums.BookingStatus.Deposited => "confirmed",
            Domain.Enums.BookingStatus.Paid => "confirmed",
            Domain.Enums.BookingStatus.PendingAdjustment => "pending",
            Domain.Enums.BookingStatus.Completed => "completed",
            Domain.Enums.BookingStatus.Cancelled => "cancelled",
            _ => "pending"
        };

        var dto = new BookingDetailDto
        {
            Id = booking.Id,
            TourInstanceId = booking.TourInstanceId,
            IsVisaRequired = booking.TourInstance?.Tour?.IsVisa ?? false,
            TourName = booking.TourInstance?.TourName ?? string.Empty,
            Reference = "PATH-" + booking.CreatedOnUtc.ToString("yyyy-MMdd-HHmm"),
            Tier = "standard", // Mocked or derived if needed
            Status = statusStr,
            TourStatus = booking.TourInstance?.Status.ToString() ?? string.Empty,
            PaymentStatus = paymentStatusStr,
            PaymentMethod = booking.PaymentMethod.ToString().ToLower(),
            Location = booking.TourInstance?.Location ?? string.Empty,
            Duration = $"{durationDays} Days",
            BookingDate = booking.CreatedOnUtc,
            DepartureDate = booking.TourInstance?.StartDate ?? DateTimeOffset.UtcNow,
            ReturnDate = booking.TourInstance?.EndDate ?? DateTimeOffset.UtcNow,
            Adults = booking.NumberAdult,
            Children = booking.NumberChild,
            Infants = booking.NumberInfant,
            PricePerPerson = booking.NumberAdult > 0 ? (booking.TotalPrice / booking.NumberAdult) : 0, // Simplify
            TotalAmount = booking.TotalPrice,
            PaidAmount = paidAmount,
            RemainingBalance = remainingBalance,
            VisaServiceFeeTotal = booking.VisaServiceFeeTotal,
            Image = booking.TourInstance?.Thumbnail?.PublicURL ?? "/assets/images/tours/placeholder.png",
            Description = booking.TourInstance?.TourName ?? string.Empty,
            Highlights = [],
            ImportantInfo = [],
            PendingTransactionCode = pendingTransactions.FirstOrDefault()?.TransactionCode,
            PendingTransactions = pendingTransactions.Select(t => new PendingTransactionDto
            {
                TransactionCode = t.TransactionCode ?? string.Empty,
                Amount = t.Amount,
                Type = t.Type.ToString(),
                Purpose = t.Type == TransactionType.VisaServiceFee ? "Visa Service Fee" : "Tour Payment",
                CreatedAt = t.CreatedOnUtc,
                ExpiresAt = null // If you have an ExpiresAt logic, add it here
            }).ToList()
        };

        return dto;
    }
}
