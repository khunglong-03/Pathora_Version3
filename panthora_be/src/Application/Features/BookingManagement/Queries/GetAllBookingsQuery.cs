using Application.Common.Pricing;
using Application.Contracts.Booking;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.BookingManagement.Queries;

public sealed record GetAllBookingsQuery(
    [property: JsonPropertyName("page")] int Page = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 20,
    [property: JsonPropertyName("managerId")] Guid? ManagerId = null,
    [property: JsonPropertyName("refundStatus")] RefundStatus? RefundStatus = null)
    : IQuery<ErrorOr<AdminBookingListResult>>;


public sealed class GetAllBookingsQueryHandler(
    IBookingRepository bookingRepository,
    IPricingPolicyRepository pricingPolicyRepository,
    ITaxConfigRepository taxConfigRepository,
    IBookingPriceCalculator priceCalculator)
    : IQueryHandler<GetAllBookingsQuery, ErrorOr<AdminBookingListResult>>
{
    public async Task<ErrorOr<AdminBookingListResult>> Handle(
        GetAllBookingsQuery request,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Min(Math.Max(1, request.PageSize), 100);

        var (items, totalCount) = request.ManagerId.HasValue
            ? await bookingRepository.GetPagedForManagerAsync(request.ManagerId.Value, page, pageSize, request.RefundStatus, cancellationToken)
            : await bookingRepository.GetAllPagedAsync(page, pageSize, request.RefundStatus, cancellationToken);

        var pricingPolicy = await pricingPolicyRepository.GetDefaultPolicy(cancellationToken);
        var taxConfigs = await taxConfigRepository.GetListAsync(t => t.IsActive, cancellationToken: cancellationToken);
        var activeTaxConfig = taxConfigs.FirstOrDefault();

        var response = items.Select(b =>
        {
            var paidAmount = b.PaymentTransactions?.Where(t => t.Status == TransactionStatus.Completed).Sum(t => t.PaidAmount ?? t.Amount) ?? 0m;
            var breakdown = priceCalculator.Calculate(b, b.TourInstance, pricingPolicy?.Tiers, activeTaxConfig, paidAmount);

            return new AdminBookingListResponse(
                b.Id,
                b.CustomerName,
                b.TourInstance.TourName,
                b.TourInstance.StartDate,
                breakdown.TotalAmount,
                b.Status.ToString(),
                b.NumberAdult,
                b.NumberChild,
                b.NumberInfant,
                b.RefundStatus.ToString(),
                b.RefundOutstandingAmount,
                b.RefundContactedAt,
                b.RefundCompletedAt,
                b.CustomerPhone,
                b.CustomerEmail,
                b.CancelledAt,
                Subtotal: breakdown.Subtotal,
                TaxAmount: breakdown.TaxAmount,
                TotalAmount: breakdown.TotalAmount,
                RemainingBalance: breakdown.RemainingBalance
            );
        }).ToList();

        return new AdminBookingListResult(response, totalCount);
    }
}
