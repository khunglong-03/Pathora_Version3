using Application.Common.Constant;
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
            Domain.Enums.BookingStatus.Completed => "completed",
            Domain.Enums.BookingStatus.Cancelled => "cancelled",
            _ => "pending"
        };

        var basePrice = booking.TourInstance?.BasePrice ?? 0m;
        var instanceType = booking.TourInstance?.InstanceType ?? Domain.Enums.TourType.Public;
        var pricingPolicy = await pricingPolicyRepository.GetActivePolicyByTourType(instanceType, cancellationToken)
            ?? await pricingPolicyRepository.GetDefaultPolicy(cancellationToken);

        var adultPrice = ApplyPricingTier(basePrice, pricingPolicy?.Tiers, 18);
        var childPrice = ApplyPricingTier(basePrice, pricingPolicy?.Tiers, 5);
        var infantPrice = ApplyPricingTier(basePrice, pricingPolicy?.Tiers, 1);

        var adultSubtotal = adultPrice * booking.NumberAdult;
        var childSubtotal = childPrice * booking.NumberChild;
        var infantSubtotal = infantPrice * booking.NumberInfant;
        var subtotal = adultSubtotal + childSubtotal + infantSubtotal;

        var taxConfigs = await taxConfigRepository.GetListAsync(t => t.IsActive, cancellationToken: cancellationToken);
        var activeTaxConfig = taxConfigs.FirstOrDefault();
        var taxRate = activeTaxConfig?.TaxRate ?? 0m;
        var taxAmount = decimal.Round(subtotal * taxRate / 100m, 0, MidpointRounding.ToEven);

        // Total = subtotal (adult + child + infant per tier) + tax + visa fee.
        // booking.TotalPrice is stale (= basePrice × numberAdult) and is no longer
        // authoritative for display; the computed totalAmount drives the UI.
        var totalAmount = subtotal + taxAmount + booking.VisaServiceFeeTotal;
        var remainingBalance = Math.Max(0m, totalAmount - paidAmount);

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
                ExpiresAt = null // If you have an ExpiresAt logic, add it here
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

        return dto;
    }

    private static decimal ApplyPricingTier(decimal basePrice, List<PricingPolicyTier>? tiers, int age)
    {
        if (tiers == null || tiers.Count == 0)
            return basePrice;

        foreach (var tier in tiers)
        {
            if (age >= tier.AgeFrom && (!tier.AgeTo.HasValue || age <= tier.AgeTo.Value))
                return basePrice * tier.PricePercentage / 100m;
        }

        return basePrice;
    }
}
