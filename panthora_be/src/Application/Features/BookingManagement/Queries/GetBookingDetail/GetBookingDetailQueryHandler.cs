using Application.Common.Constant;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.BookingManagement.Queries.GetBookingDetail;

public class GetBookingDetailQueryHandler(
    IBookingRepository bookingRepository) : IQueryHandler<GetBookingDetailQuery, ErrorOr<BookingDetailDto>>
{
    public async Task<ErrorOr<BookingDetailDto>> Handle(GetBookingDetailQuery request, CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdWithDetailsAsync(request.BookingId, cancellationToken);

        if (booking == null)
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, "Booking not found");

        var paidAmount = booking.Payments.Sum(p => p.Amount);
        var remainingBalance = Math.Max(0, booking.TotalPrice - paidAmount);

        // Find pending transaction if any
        var pendingTransaction = booking.PaymentTransactions
            .Where(t => t.Status == Domain.Enums.TransactionStatus.Pending)
            .OrderByDescending(t => t.CreatedOnUtc)
            .FirstOrDefault();

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
            TourName = booking.TourInstance?.TourName ?? string.Empty,
            Reference = "PATH-" + booking.CreatedOnUtc.ToString("yyyy-MMdd-HHmm"),
            Tier = "standard", // Mocked or derived if needed
            Status = statusStr,
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
            Image = "/assets/images/tours/placeholder.png",
            Description = booking.TourInstance?.TourName ?? string.Empty,
            Highlights = [],
            ImportantInfo = [],
            PendingTransactionId = pendingTransaction?.Id
        };

        return dto;
    }
}
