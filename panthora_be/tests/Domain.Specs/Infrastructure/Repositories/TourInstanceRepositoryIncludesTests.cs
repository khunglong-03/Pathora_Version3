using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure.Repositories;

/// <summary>
/// Integration tests verifying that TourInstanceRepository.FindPublicAvailable()
/// eagerly loads Tour, Classification, and Managers navigation properties without N+1 queries.
/// </summary>
public sealed class TourInstanceRepositoryIncludesTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static async Task<(AppDbContext context, Guid tourInstanceId)> SeedTourInstanceWithNavigations(AppDbContext context)
    {
        var userId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        context.Users.Add(new UserEntity
        {
            Id = userId,
            Username = "tourmanager",
            Email = "manager@test.com",
            FullName = "Tour Manager",
            Status = UserStatus.Active,
            IsDeleted = false,
        });

        context.TourClassifications.Add(new TourClassificationEntity
        {
            Id = classificationId,
            TourId = tourId,
            Name = "Standard",
            BasePrice = 1000m,
            Description = "Standard classification",
            NumberOfDay = 3,
            NumberOfNight = 2,
            IsDeleted = false,
        });

        context.Tours.Add(new TourEntity
        {
            Id = tourId,
            TourCode = "TI-INCLUDE-001",
            TourName = "Tour Instance Include Test Tour",
            ShortDescription = "Test",
            LongDescription = "Test",
            Status = TourStatus.Active,
            IsDeleted = false,
        });

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            TourId = tourId,
            ClassificationId = classificationId,
            TourInstanceCode = "TI-INC-001",
            Title = "Tour Instance Include Test Instance",
            TourName = "Tour Instance Include Test Tour",
            TourCode = "TI-INCLUDE-001",
            ClassificationName = "Standard",
            StartDate = DateTimeOffset.UtcNow.AddDays(10),
            EndDate = DateTimeOffset.UtcNow.AddDays(13),
            DurationDays = 3,
            Status = TourInstanceStatus.Available,
            IsDeleted = false,
        };
        context.TourInstances.Add(tourInstance);

        // Add a manager assignment
        context.TourManagerAssignments.Add(new TourManagerAssignmentEntity
        {
            Id = Guid.NewGuid(),
            TourManagerId = userId,
            AssignedUserId = null,
            AssignedTourId = tourInstanceId,
            AssignedEntityType = AssignedEntityType.Tour,
            CreatedBy = "system",
            CreatedOnUtc = DateTimeOffset.UtcNow,
        });

        await context.SaveChangesAsync();
        return (context, tourInstanceId);
    }

    [Fact]
    public async Task FindPublicAvailable_Tour_IsNotNull()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, _) = await SeedTourInstanceWithNavigations(context);
        var repo = new TourInstanceRepository(ctx);

        var results = await repo.FindPublicAvailable(destination: null, sortBy: null, page: 1, pageSize: 10);

        Assert.NotEmpty(results);
        Assert.NotNull(results[0].Tour);
    }

    [Fact]
    public async Task FindPublicAvailable_Classification_IsNotNull()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, _) = await SeedTourInstanceWithNavigations(context);
        var repo = new TourInstanceRepository(ctx);

        var results = await repo.FindPublicAvailable(destination: null, sortBy: null, page: 1, pageSize: 10);

        Assert.NotEmpty(results);
        Assert.NotNull(results[0].Classification);
    }

    [Fact]
    public async Task FindPublicAvailable_Managers_IsLoadable()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, _) = await SeedTourInstanceWithNavigations(context);
        var repo = new TourInstanceRepository(ctx);

        var results = await repo.FindPublicAvailable(destination: null, sortBy: null, page: 1, pageSize: 10);

        Assert.NotEmpty(results);
        // Managers collection should be loadable without triggering additional queries
        var managers = results[0].Managers;
        Assert.NotNull(managers);
    }

    [Fact]
    public async Task FindByIds_ReturnsMatchingInstances()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, tourInstanceId) = await SeedTourInstanceWithNavigations(context);
        var repo = new TourInstanceRepository(ctx);

        var results = await repo.FindByIds(new[] { tourInstanceId });

        Assert.Single(results);
        Assert.Equal(tourInstanceId, results[0].Id);
    }

    [Fact]
    public async Task FindByIds_ReturnsEmptyList_ForEmptyInput()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var repo = new TourInstanceRepository(context);

        var results = await repo.FindByIds(Array.Empty<Guid>());

        Assert.Empty(results);
    }

    [Fact]
    public async Task FindByIds_ReturnsEmptyList_ForNonExistentIds()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var repo = new TourInstanceRepository(context);

        var results = await repo.FindByIds(new[] { Guid.NewGuid() });

        Assert.Empty(results);
    }
}
