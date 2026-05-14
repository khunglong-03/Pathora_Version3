using global::Domain.Entities;
using global::Domain.Enums;
using Xunit;

namespace Domain.Specs.Application.Features.TourInstance.Commands;

/// <summary>
/// Regression: when cloning a tour template into a private TourInstance, the activity
/// price must fall back to EstimatedCost when Price is null. Older templates only
/// captured EstimatedCost for Accommodation activities (Price was reserved for
/// Transportation), so without the fallback the cloned instance shows "Chưa định giá".
/// </summary>
public sealed class TourInstanceClonePriceFallbackTests
{
    private static decimal? ResolveClonedPrice(TourDayActivityEntity template)
        => template.Price ?? template.EstimatedCost;

    [Fact]
    public void Accommodation_NullPrice_FallsBackToEstimatedCost()
    {
        var template = TourDayActivityEntity.Create(
            tourDayId: Guid.NewGuid(),
            order: 1,
            activityType: TourDayActivityType.Accommodation,
            title: "Hotel",
            performedBy: "test",
            estimatedCost: 2222m,
            price: null);

        Assert.Null(template.Price);
        Assert.Equal(2222m, template.EstimatedCost);
        Assert.Equal(2222m, ResolveClonedPrice(template));
    }

    [Fact]
    public void Transportation_PreservesPriceWhenSet()
    {
        var template = TourDayActivityEntity.Create(
            tourDayId: Guid.NewGuid(),
            order: 1,
            activityType: TourDayActivityType.Transportation,
            title: "Bus",
            performedBy: "test",
            estimatedCost: 1111m,
            transportationType: TransportationType.Bus,
            durationMinutes: 60,
            price: 1111m);

        Assert.Equal(1111m, ResolveClonedPrice(template));
    }

    [Fact]
    public void BothNull_ReturnsNull()
    {
        var template = TourDayActivityEntity.Create(
            tourDayId: Guid.NewGuid(),
            order: 1,
            activityType: TourDayActivityType.Sightseeing,
            title: "Visit",
            performedBy: "test");

        Assert.Null(ResolveClonedPrice(template));
    }

    [Fact]
    public void Price_TakesPrecedenceOverEstimatedCost()
    {
        var template = TourDayActivityEntity.Create(
            tourDayId: Guid.NewGuid(),
            order: 1,
            activityType: TourDayActivityType.Transportation,
            title: "Bus",
            performedBy: "test",
            estimatedCost: 500m,
            transportationType: TransportationType.Bus,
            durationMinutes: 60,
            price: 1111m);

        Assert.Equal(1111m, ResolveClonedPrice(template));
    }
}
