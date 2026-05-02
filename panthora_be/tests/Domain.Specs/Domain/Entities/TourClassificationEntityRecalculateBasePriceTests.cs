namespace Domain.Specs.Entities;

using global::Domain.Entities;
using global::Domain.Enums;

/// <summary>
/// Unit tests for <see cref="TourClassificationEntity.RecalculateBasePrice"/>.
/// </summary>
public sealed class TourClassificationEntityRecalculateBasePriceTests
{
    private static TourClassificationEntity NewClassification(decimal seedBasePrice = 0m)
    {
        return new TourClassificationEntity
        {
            Id = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            Name = "Standard",
            BasePrice = seedBasePrice,
            Description = "desc",
            NumberOfDay = 1,
            NumberOfNight = 0,
        };
    }

    private static TourDayEntity AddPlan(TourClassificationEntity classification, int dayNumber = 1, bool isDeleted = false)
    {
        var plan = new TourDayEntity
        {
            Id = Guid.NewGuid(),
            ClassificationId = classification.Id,
            DayNumber = dayNumber,
            Title = $"Day {dayNumber}",
            IsDeleted = isDeleted,
        };
        classification.Plans.Add(plan);
        return plan;
    }

    private static TourDayActivityEntity AddActivity(
        TourDayEntity plan,
        TourDayActivityType type,
        decimal? estimatedCost = null,
        decimal? price = null,
        decimal? roomPrice = null,
        bool isOptional = false,
        bool isDeleted = false)
    {
        var activity = new TourDayActivityEntity
        {
            Id = Guid.NewGuid(),
            TourDayId = plan.Id,
            Order = plan.Activities.Count + 1,
            ActivityType = type,
            Title = $"Activity {plan.Activities.Count + 1}",
            EstimatedCost = estimatedCost,
            Price = price,
            IsOptional = isOptional,
            IsDeleted = isDeleted,
        };

        if (type == TourDayActivityType.Accommodation)
        {
            activity.Accommodation = new TourPlanAccommodationEntity
            {
                Id = Guid.NewGuid(),
                AccommodationName = "Hotel",
                RoomType = RoomType.Double,
                RoomCapacity = 2,
                MealsIncluded = MealType.None,
                RoomPrice = roomPrice,
                TourDayActivityId = activity.Id,
            };
        }

        plan.Activities.Add(activity);
        return activity;
    }

    [Fact]
    public void RecalculateBasePrice_MixedActivityTypes_SumsCorrectly()
    {
        var classification = NewClassification(seedBasePrice: 9999m);
        var plan = AddPlan(classification);
        AddActivity(plan, TourDayActivityType.Sightseeing, estimatedCost: 200_000m);
        AddActivity(plan, TourDayActivityType.Transportation, price: 100_000m);
        AddActivity(plan, TourDayActivityType.Accommodation, roomPrice: 500_000m);
        AddActivity(plan, TourDayActivityType.Dining, estimatedCost: 150_000m);

        classification.RecalculateBasePrice();

        Assert.Equal(950_000m, classification.BasePrice);
    }

    [Fact]
    public void RecalculateBasePrice_TransportPrefersPrice()
    {
        var classification = NewClassification();
        var plan = AddPlan(classification);
        AddActivity(plan, TourDayActivityType.Transportation, estimatedCost: 80_000m, price: 100_000m);

        classification.RecalculateBasePrice();

        Assert.Equal(100_000m, classification.BasePrice);
    }

    [Fact]
    public void RecalculateBasePrice_TransportFallsBackToEstimatedCost()
    {
        var classification = NewClassification();
        var plan = AddPlan(classification);
        AddActivity(plan, TourDayActivityType.Transportation, estimatedCost: 80_000m, price: null);

        classification.RecalculateBasePrice();

        Assert.Equal(80_000m, classification.BasePrice);
    }

    [Fact]
    public void RecalculateBasePrice_AccommodationPrefersRoomPrice()
    {
        var classification = NewClassification();
        var plan = AddPlan(classification);
        AddActivity(plan, TourDayActivityType.Accommodation, estimatedCost: 400_000m, roomPrice: 500_000m);

        classification.RecalculateBasePrice();

        Assert.Equal(500_000m, classification.BasePrice);
    }

    [Fact]
    public void RecalculateBasePrice_AccommodationFallsBackToEstimatedCost()
    {
        var classification = NewClassification();
        var plan = AddPlan(classification);
        AddActivity(plan, TourDayActivityType.Accommodation, estimatedCost: 400_000m, roomPrice: null);

        classification.RecalculateBasePrice();

        Assert.Equal(400_000m, classification.BasePrice);
    }

    [Fact]
    public void RecalculateBasePrice_IncludesOptionalActivities()
    {
        var classification = NewClassification();
        var plan = AddPlan(classification);
        AddActivity(plan, TourDayActivityType.Sightseeing, estimatedCost: 100_000m, isOptional: true);

        classification.RecalculateBasePrice();

        Assert.Equal(100_000m, classification.BasePrice);
    }

    [Fact]
    public void RecalculateBasePrice_ExcludesDeletedActivities()
    {
        var classification = NewClassification();
        var plan = AddPlan(classification);
        AddActivity(plan, TourDayActivityType.Sightseeing, estimatedCost: 200_000m);
        AddActivity(plan, TourDayActivityType.Sightseeing, estimatedCost: 100_000m, isDeleted: true);

        classification.RecalculateBasePrice();

        Assert.Equal(200_000m, classification.BasePrice);
    }

    [Fact]
    public void RecalculateBasePrice_ExcludesDeletedPlans()
    {
        var classification = NewClassification();
        var keptPlan = AddPlan(classification, dayNumber: 1);
        AddActivity(keptPlan, TourDayActivityType.Sightseeing, estimatedCost: 200_000m);
        var removedPlan = AddPlan(classification, dayNumber: 2, isDeleted: true);
        AddActivity(removedPlan, TourDayActivityType.Sightseeing, estimatedCost: 1_000_000m);

        classification.RecalculateBasePrice();

        Assert.Equal(200_000m, classification.BasePrice);
    }

    [Fact]
    public void RecalculateBasePrice_NullCostsContributeZero()
    {
        var classification = NewClassification(seedBasePrice: 1234m);
        var plan = AddPlan(classification);
        AddActivity(plan, TourDayActivityType.Sightseeing);
        AddActivity(plan, TourDayActivityType.Transportation);
        AddActivity(plan, TourDayActivityType.Accommodation);

        classification.RecalculateBasePrice();

        Assert.Equal(0m, classification.BasePrice);
    }

    [Fact]
    public void RecalculateBasePrice_NoPlans_ReturnsZero()
    {
        var classification = NewClassification(seedBasePrice: 5_000_000m);

        classification.RecalculateBasePrice();

        Assert.Equal(0m, classification.BasePrice);
    }
}
