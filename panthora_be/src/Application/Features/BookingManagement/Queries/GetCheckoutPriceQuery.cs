using Application.Contracts.Booking;
using Application.Services;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.BookingManagement.Queries;

public sealed record GetCheckoutPriceQuery([property: JsonPropertyName("bookingId")] Guid BookingId) : IQuery<ErrorOr<CheckoutPriceResponse>>;

public sealed class GetCheckoutPriceQueryHandler(
    IBookingRepository bookingRepository,
    ITaxConfigRepository taxConfigRepository,
    IPricingPolicyRepository pricingPolicyRepository)
    : IQueryHandler<GetCheckoutPriceQuery, ErrorOr<CheckoutPriceResponse>>
{
    public async Task<ErrorOr<CheckoutPriceResponse>> Handle(GetCheckoutPriceQuery request, CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking == null)
            return Error.NotFound("Booking not found");

        var tourInstance = booking.TourInstance;
        if (tourInstance == null)
            return Error.Failure("Tour instance not found");

        var taxConfigs = await taxConfigRepository.GetListAsync(t => t.IsActive);
        var activeTaxConfig = taxConfigs.FirstOrDefault();

        var pricingPolicy = await pricingPolicyRepository.GetActivePolicyByTourType(tourInstance.InstanceType)
            ?? await pricingPolicyRepository.GetDefaultPolicy();

        decimal adultPrice = tourInstance.BasePrice;
        decimal childPrice = tourInstance.BasePrice;
        decimal infantPrice = tourInstance.BasePrice;

        if (pricingPolicy != null)
        {
            adultPrice = ApplyPricingTier(tourInstance.BasePrice, pricingPolicy.Tiers, 18);
            childPrice = ApplyPricingTier(tourInstance.BasePrice, pricingPolicy.Tiers, 5);
            infantPrice = ApplyPricingTier(tourInstance.BasePrice, pricingPolicy.Tiers, 1);
        }

        var adultSubtotal = adultPrice * booking.NumberAdult;
        var childSubtotal = childPrice * booking.NumberChild;
        var infantSubtotal = infantPrice * booking.NumberInfant;
        var subtotal = adultSubtotal + childSubtotal + infantSubtotal;

        var taxRate = activeTaxConfig?.TaxRate ?? 0;
        var taxAmount = subtotal * taxRate / 100;
        var totalPrice = subtotal + taxAmount;

        var depositPercentage = 30m;
        var depositAmount = totalPrice * depositPercentage / 100;
        var remainingBalance = totalPrice - depositAmount;

        return new CheckoutPriceResponse(
            booking.Id,
            tourInstance.Id,
            tourInstance.TourName,
            tourInstance.TourCode,
            tourInstance.Thumbnail?.PublicURL,
            tourInstance.StartDate,
            tourInstance.EndDate,
            tourInstance.DurationDays,
            tourInstance.Location,
            booking.NumberAdult,
            booking.NumberChild,
            booking.NumberInfant,
            adultPrice,
            childPrice,
            infantPrice,
            adultSubtotal,
            childSubtotal,
            infantSubtotal,
            subtotal,
            taxRate,
            taxAmount,
            totalPrice,
            depositPercentage,
            depositAmount,
            remainingBalance);
    }

    private static decimal ApplyPricingTier(decimal basePrice, List<Domain.ValueObjects.PricingPolicyTier> tiers, int age)
    {
        foreach (var tier in tiers)
        {
            if (age >= tier.AgeFrom && (!tier.AgeTo.HasValue || age <= tier.AgeTo.Value))
            {
                return basePrice * tier.PricePercentage / 100;
            }
        }
        return basePrice;
    }
}
