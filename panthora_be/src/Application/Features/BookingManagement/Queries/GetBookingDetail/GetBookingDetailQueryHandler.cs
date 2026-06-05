using Application.Common.Constant;
using Application.Common.Pricing;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;
using ErrorOr;

namespace Application.Features.BookingManagement.Queries.GetBookingDetail;

public class GetBookingDetailQueryHandler(
    IBookingRepository bookingRepository,
    IBookingCancellationRequestRepository cancellationRequestRepository,
    IPricingPolicyRepository pricingPolicyRepository,
    ITaxConfigRepository taxConfigRepository,
    IBookingPriceCalculator priceCalculator,
    ITourInstanceBookingTicketRepository ticketRepository,
    ITourInstanceBookingRoomAssignmentRepository roomAssignmentRepository,
    ITourDayActivityStatusRepository dayActivityStatusRepository,
    ITicketImageRepository ticketImageRepository,
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

        // Exclude unpaid visa service fees from tour remaining — those are paid via separate VisaServiceFee transactions.
        var pendingVisaServiceFees = booking.PaymentTransactions
            .Where(t => t.Type == TransactionType.VisaServiceFee && t.Status == Domain.Enums.TransactionStatus.Pending)
            .Sum(t => t.Amount);

        // Include VisaServiceFeeTotal inside TotalPrice has been handled in booking.AddVisaServiceFee.
        var remainingBalance = Math.Max(0, booking.TotalPrice - paidAmount - pendingVisaServiceFees);

        var pendingTransactions = booking.PaymentTransactions
            .Where(t => t.Status == Domain.Enums.TransactionStatus.Pending)
            .OrderByDescending(t => t.CreatedOnUtc)
            .ToList();

        var durationDays = booking.TourInstance?.EndDate.Subtract(booking.TourInstance.StartDate).Days + 1 ?? 1;

        string statusStr = booking.Status switch
        {
            Domain.Enums.BookingStatus.Pending => "pending",
            Domain.Enums.BookingStatus.Confirmed => "confirmed",
            Domain.Enums.BookingStatus.Deposited => "confirmed",
            Domain.Enums.BookingStatus.Paid => "confirmed",
            Domain.Enums.BookingStatus.PendingAdjustment => "pending",
            Domain.Enums.BookingStatus.PendingCancellation => "pending_cancellation",
            Domain.Enums.BookingStatus.Completed => "completed",
            Domain.Enums.BookingStatus.Cancelled => "cancelled",
            _ => "pending"
        };

        var basePrice = booking.TourInstance?.BasePrice ?? 0m;
        var instanceType = booking.TourInstance?.InstanceType ?? Domain.Enums.TourType.Public;
        var pricingPolicy = await pricingPolicyRepository.GetActivePolicyByTourType(instanceType, cancellationToken)
            ?? await pricingPolicyRepository.GetDefaultPolicy(cancellationToken);

        var taxConfigs = await taxConfigRepository.GetListAsync(t => t.IsActive, cancellationToken: cancellationToken);
        var activeTaxConfig = taxConfigs.FirstOrDefault();

        var breakdown = priceCalculator.Calculate(
            booking,
            booking.TourInstance!,
            pricingPolicy?.Tiers,
            activeTaxConfig,
            paidAmount);

        var adultPrice = breakdown.AdultUnitPrice;
        var childPrice = breakdown.ChildUnitPrice;
        var infantPrice = breakdown.InfantUnitPrice;
        var adultSubtotal = breakdown.AdultSubtotal;
        var childSubtotal = breakdown.ChildSubtotal;
        var infantSubtotal = breakdown.InfantSubtotal;
        var subtotal = breakdown.Subtotal;
        var taxRate = breakdown.TaxRate;
        var taxAmount = breakdown.TaxAmount;
        var totalAmount = breakdown.TotalAmount;

        string paymentStatusStr = booking.Status switch
        {
            Domain.Enums.BookingStatus.Paid => "paid",
            Domain.Enums.BookingStatus.Completed => "paid",
            Domain.Enums.BookingStatus.Deposited => "partial",
            _ => paidAmount > 0 ? (paidAmount >= totalAmount ? "paid" : "partial") : "unpaid"
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
            PricePerPerson = adultPrice,
            AdultPrice = adultPrice,
            ChildPrice = childPrice,
            InfantPrice = infantPrice,
            AdultSubtotal = adultSubtotal,
            ChildSubtotal = childSubtotal,
            InfantSubtotal = infantSubtotal,
            Subtotal = subtotal,
            TaxRate = taxRate,
            TaxAmount = taxAmount,
            TotalAmount = totalAmount,
            PaidAmount = paidAmount,
            RemainingBalance = remainingBalance,
            VisaServiceFeeTotal = booking.VisaServiceFeeTotal,
            IsVisaFeePending = booking.VisaServiceFeeTotal > 0
                && !(booking.PaymentTransactions?.Any(t =>
                    t.Type == Domain.Enums.TransactionType.VisaServiceFee
                    && t.Status == Domain.Enums.TransactionStatus.Completed) ?? false),
            BookingType = booking.BookingType.ToString(),
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
                ExpiresAt = t.ExpiredAt
            }).ToList()
        };

        var allRequests = await cancellationRequestRepository.GetByBookingIdAsync(booking.Id, cancellationToken);
        if (allRequests.Count > 0)
        {
            dto.CancellationRequests = allRequests.OrderByDescending(r => r.CreatedOnUtc).Select(req => new BookingCancellationRequestSummaryDto
            {
                RequestId = req.Id,
                Status = req.Status.ToString(),
                FeePercent = req.FeePercent,
                PaidAmountSnapshot = req.PaidAmountSnapshot,
                RefundAmount = req.RefundAmount,
                ManagerNote = req.ManagerNote,
                CreatedAt = req.CreatedAt,
                ReviewedAt = req.ReviewedAt,
                RefundConfirmedAt = req.RefundConfirmedAt
            }).ToList();

            dto.CancellationRequest = dto.CancellationRequests.FirstOrDefault();
        }

        var tickets = await ticketRepository.GetByBookingIdAsync(booking.Id, cancellationToken);
        var roomAssignments = await roomAssignmentRepository.GetByBookingIdAsync(booking.Id, cancellationToken);
        var dayStatuses = await dayActivityStatusRepository.GetByBookingIdAsync(booking.Id, cancellationToken);
        var ticketImages = await ticketImageRepository.GetByBookingIdAsync(booking.Id, booking.TourInstanceId, cancellationToken);

        dto.Tickets = tickets.Select(t => new CustomerTicketDto
        {
            Id = t.Id,
            TourInstanceDayActivityId = t.TourInstanceDayActivityId,
            FlightNumber = t.FlightNumber,
            DepartureAt = t.DepartureAt,
            ArrivalAt = t.ArrivalAt,
            SeatNumbers = t.SeatNumbers,
            ETicketNumbers = t.ETicketNumbers,
            SeatClass = t.SeatClass,
            Note = t.Note
        }).ToList();

        dto.RoomAssignments = roomAssignments.Select(r => new CustomerRoomAssignmentDto
        {
            Id = r.Id,
            TourInstanceDayActivityId = r.TourInstanceDayActivityId,
            RoomType = r.RoomType.ToString(),
            RoomCount = r.RoomCount,
            RoomNumbers = r.RoomNumbers,
            Note = r.Note
        }).ToList();

        dto.DayStatuses = dayStatuses.Select(d => new CustomerDayStatusDto
        {
            Id = d.Id,
            TourDayId = d.TourDayId,
            ActivityStatus = d.ActivityStatus.ToString(),
            ActualStartTime = d.ActualStartTime,
            ActualEndTime = d.ActualEndTime,
            CompletedAt = d.CompletedAt,
            CancellationReason = d.CancellationReason,
            Note = d.Note
        }).ToList();

        dto.TicketImages = ticketImages.Select(ti => new CustomerTicketImageDto
        {
            Id = ti.Id,
            TourInstanceDayActivityId = ti.TourInstanceDayActivityId,
            PublicUrl = ti.Image?.PublicURL ?? string.Empty,
            BookingReference = ti.BookingReference,
            Note = ti.Note
        }).ToList();

        return dto;
    }
}
