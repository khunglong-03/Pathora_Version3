using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure.Repositories;

/// <summary>
/// Integration tests verifying that TourRepository.FindById()
/// eagerly loads Classifications with their Plans chain to prevent N+1 queries.
/// </summary>
public sealed class TourRepositoryIncludesTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static async Task<(AppDbContext context, Guid tourId)> SeedTourWithClassifications(AppDbContext context)
    {
        var tourId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var accommodationId = Guid.NewGuid();

        var tour = new TourEntity
        {
            Id = tourId,
            TourCode = "INC-TEST-001",
            TourName = "Include Classification Test Tour",
            ShortDescription = "Test",
            LongDescription = "Test",
            Status = TourStatus.Active,
        };
        context.Tours.Add(tour);

        var classification = new TourClassificationEntity
        {
            Id = classificationId,
            TourId = tourId,
            Name = "Premium",
            BasePrice = 2000m,
            Description = "Premium classification",
            NumberOfDay = 5,
            NumberOfNight = 4,
        };
        context.TourClassifications.Add(classification);

        var day = new TourDayEntity
        {
            Id = dayId,
            ClassificationId = classificationId,
            DayNumber = 1,
            Title = "Day 1",
        };
        context.TourDays.Add(day);

        var activity = new TourDayActivityEntity
        {
            Id = activityId,
            TourDayId = dayId,
            Order = 1,
            Title = "Day 1 Activity",
            ActivityType = TourDayActivityType.Accommodation,
        };
        context.TourDayActivities.Add(activity);

        var accommodation = new TourPlanAccommodationEntity
        {
            Id = accommodationId,
            AccommodationName = "Test Hotel",
            RoomType = RoomType.Deluxe,
            IsDeleted = false,
        };
        context.TourPlanAccommodations.Add(accommodation);

        activity.Accommodation = accommodation;
        day.Activities.Add(activity);
        classification.Plans.Add(day);
        tour.Classifications.Add(classification);

        await context.SaveChangesAsync();
        return (context, tourId);
    }

    [Fact]
    public async Task FindById_Tracking_Classifications_IsAccessible()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, tourId) = await SeedTourWithClassifications(context);
        var repo = new TourRepository(ctx);

        var tour = await repo.FindById(tourId, asNoTracking: false);

        Assert.NotNull(tour);
        Assert.NotNull(tour.Classifications);
        Assert.NotEmpty(tour.Classifications);
    }

    [Fact]
    public async Task FindById_Tracking_Plans_IsAccessible()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, tourId) = await SeedTourWithClassifications(context);
        var repo = new TourRepository(ctx);

        var tour = await repo.FindById(tourId, asNoTracking: false);

        Assert.NotNull(tour);
        Assert.NotEmpty(tour.Classifications);
        var classification = tour.Classifications.First();
        Assert.NotNull(classification.Plans);
        Assert.NotEmpty(classification.Plans);
    }

    [Fact]
    public async Task FindById_Tracking_Activities_IsAccessible()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, tourId) = await SeedTourWithClassifications(context);
        var repo = new TourRepository(ctx);

        var tour = await repo.FindById(tourId, asNoTracking: false);

        Assert.NotNull(tour);
        Assert.NotEmpty(tour.Classifications);
        var classification = tour.Classifications.First();
        Assert.NotEmpty(classification.Plans);
        var day = classification.Plans.First();
        Assert.NotNull(day.Activities);
        Assert.NotEmpty(day.Activities);
    }

    [Fact]
    public async Task FindById_Tracking_Accommodation_IsAccessible()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, tourId) = await SeedTourWithClassifications(context);
        var repo = new TourRepository(ctx);

        var tour = await repo.FindById(tourId, asNoTracking: false);

        Assert.NotNull(tour);
        Assert.NotEmpty(tour.Classifications);
        var classification = tour.Classifications.First();
        Assert.NotEmpty(classification.Plans);
        var day = classification.Plans.First();
        Assert.NotEmpty(day.Activities);
        var activity = day.Activities.First();
        Assert.NotNull(activity.Accommodation);
        Assert.Equal("Test Hotel", activity.Accommodation.AccommodationName);
    }

    [Fact]
    public async Task FindLatestTours_Classifications_IsAccessible()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, tourId) = await SeedTourWithClassifications(context);
        var repo = new TourRepository(ctx);

        var tours = await repo.FindLatestTours(limit: 10);

        Assert.NotEmpty(tours);
        Assert.NotNull(tours[0].Classifications);
    }
}
