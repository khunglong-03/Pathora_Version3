using Application.Common.Interfaces;
using Application.Common.Pricing;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using MediatR;
using System.Linq;

namespace Application.Features.BookingManagement.Queries.GetMyBookings;

public sealed class GetMyBookingsQueryHandler(
    IBookingRepository bookingRepository,
    ICurrentUser currentUserService,
    IPricingPolicyRepository pricingPolicyRepository,
    ITaxConfigRepository taxConfigRepository,
    IBookingPriceCalculator priceCalculator)
    : IRequestHandler<GetMyBookingsQuery, ErrorOr<MyBookingListResult>>
{
    public async Task<ErrorOr<MyBookingListResult>> Handle(
        GetMyBookingsQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = currentUserService.Id;
        if (currentUserId == null)
        {
            return Error.Unauthorized("User.Unauthorized", "User is not authenticated.");
        }

        var userIdString = currentUserId.Value.ToString();

        var result = await bookingRepository.GetPagedBookingsForUserAsync(
            userIdString,
            request.StatusFilter,
            request.Page,
            request.PageSize,
            cancellationToken);

        var items = result.Items;
        var totalCount = result.TotalCount;

        // Fetch pricing dependencies once (outside loop)
        var pricingPolicy = await pricingPolicyRepository.GetDefaultPolicy(cancellationToken);
        var taxConfigs = await taxConfigRepository.GetListAsync(t => t.IsActive, cancellationToken: cancellationToken);
        var activeTaxConfig = taxConfigs.FirstOrDefault();

        var dtos = items.Select(b =>
        {
            var paidAmount = b.PaymentTransactions?.Where(t => t.Status == TransactionStatus.Completed).Sum(t => t.PaidAmount ?? t.Amount) ?? 0m;

            var breakdown = priceCalculator.Calculate(
                b,
                b.TourInstance!,
                pricingPolicy?.Tiers,
                activeTaxConfig,
                paidAmount);

            var paymentStatus = paidAmount >= breakdown.TotalAmount ? PaymentStatus.Paid : (paidAmount > 0 ? PaymentStatus.Partial : PaymentStatus.Unpaid);

            return new MyBookingDto(
                Id: b.Id,
                TourName: b.TourInstance?.TourName ?? string.Empty,
                TourInstanceId: b.TourInstanceId,
                Reference: b.Id.ToString().Substring(0, 8).ToUpper(),
                Status: b.Status,
                TourStatus: b.TourInstance?.Status.ToString() ?? string.Empty,
                PaymentStatus: paymentStatus,
                TotalPrice: breakdown.TotalAmount,
                PaidAmount: paidAmount,
                StartDate: b.TourInstance?.StartDate ?? DateTimeOffset.MinValue,
                EndDate: b.TourInstance?.EndDate ?? DateTimeOffset.MinValue,
                Location: b.TourInstance?.Location ?? string.Empty,
                ThumbnailUrl: b.TourInstance?.Thumbnail?.PublicURL,
                Adults: b.NumberAdult,
                Children: b.NumberChild,
                Infants: b.NumberInfant,
                CreatedAt: b.CreatedOnUtc,
                AdultUnitPrice: breakdown.AdultUnitPrice,
                ChildUnitPrice: breakdown.ChildUnitPrice,
                InfantUnitPrice: breakdown.InfantUnitPrice,
                Subtotal: breakdown.Subtotal,
                TaxAmount: breakdown.TaxAmount,
                TotalAmount: breakdown.TotalAmount,
                RemainingBalance: breakdown.RemainingBalance
            );
        }).ToList();

        return new MyBookingListResult(
            Items: dtos,
            TotalCount: totalCount);
    }
}
