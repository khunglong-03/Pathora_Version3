using global::Domain.Entities;
using global::Domain.Enums;
using global::Infrastructure.Data;
using global::Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure.Repositories;

public sealed class TourInstanceRepositorySortingTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static TourInstanceEntity CreateEntity(string title, DateTimeOffset created, DateTimeOffset? modified = null)
    {
        return new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            ClassificationId = Guid.NewGuid(),
            TourInstanceCode = $"TI-{Guid.NewGuid().ToString()[..8]}",
            Title = title,
            TourName = "Tour name",
            TourCode = "TOUR-001",
            ClassificationName = "Standard",
            StartDate = DateTimeOffset.UtcNow,
            EndDate = DateTimeOffset.UtcNow.AddDays(1),
            DurationDays = 2,
            MaxParticipation = 10,
            BasePrice = 1000m,
            Status = TourInstanceStatus.Available,
            InstanceType = TourType.Public,
            CreatedOnUtc = created,
            LastModifiedOnUtc = modified
        };
    }

    private static void SeedRelations(AppDbContext context, TourInstanceEntity instance)
    {
        var tour = new TourEntity
        {
            Id = instance.TourId,
            TourName = "Tour Name",
            TourCode = instance.TourCode,
            ShortDescription = "Short",
            LongDescription = "Long",
            Status = TourStatus.Active
        };
        context.Tours.Add(tour);

        var classification = new TourClassificationEntity
        {
            Id = instance.ClassificationId,
            TourId = instance.TourId,
            Name = "Standard",
            BasePrice = 1000m,
            Description = "Standard Description",
            NumberOfDay = 2,
            NumberOfNight = 1,
            CreatedBy = "admin",
            CreatedOnUtc = DateTime.UtcNow
        };
        context.TourClassifications.Add(classification);

        instance.Tour = tour;
        instance.Classification = classification;
        instance.Thumbnail = new ImageEntity 
        { 
            FileId = Guid.NewGuid().ToString(), 
            FileName = "thumb.jpg", 
            OriginalFileName = "thumb.jpg",
            PublicURL = "http://example.com/thumb.jpg" 
        };
    }

    [Fact]
    public async Task FindAll_WithoutPrincipalId_ShouldSortByLastModifiedOnUtcDesc()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        
        var baseTime = DateTimeOffset.UtcNow;
        
        // Entity 1: Created early, modified late (Should be 1st)
        var entity1 = CreateEntity("Modified Late", baseTime.AddMinutes(-10), baseTime.AddMinutes(5));
        SeedRelations(context, entity1);
        
        // Entity 2: Created late, modified early (Should be 3rd)
        var entity2 = CreateEntity("Modified Early", baseTime.AddMinutes(-1), baseTime.AddMinutes(-5));
        SeedRelations(context, entity2);
        
        // Entity 3: Created in-between, modified in-between (Should be 2nd)
        var entity3 = CreateEntity("Modified Mid", baseTime.AddMinutes(-5), baseTime.AddMinutes(0));
        SeedRelations(context, entity3);

        context.TourInstances.AddRange(entity1, entity2, entity3);
        await context.SaveChangesAsync();

        var repo = new TourInstanceRepository(context);

        // Act
        var result = await repo.FindAll(
            searchText: null,
            status: null,
            pageNumber: 1,
            pageSize: 10,
            excludePast: false,
            wantsCustomization: null,
            instanceType: null,
            principalId: null,
            statuses: null,
            cancellationToken: CancellationToken.None);

        // Assert
        Assert.Equal(3, result.Count);
        Assert.Equal("Modified Late", result[0].Title); // LastModifiedOnUtc = +5 mins
        Assert.Equal("Modified Mid", result[1].Title);  // LastModifiedOnUtc = 0 mins
        Assert.Equal("Modified Early", result[2].Title); // LastModifiedOnUtc = -5 mins
    }

    [Fact]
    public async Task FindAll_WithPrincipalId_ShouldSortByLastModifiedOnUtcDescPriority()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        
        var principalId = Guid.NewGuid();
        var baseTime = DateTimeOffset.UtcNow;

        var tourOperatorId = Guid.NewGuid();
        
        // We need custom manager assignments for the principal to see them if principalId is specified
        var entity1 = CreateEntity("Modified Late Manager", baseTime.AddMinutes(-10), baseTime.AddMinutes(5));
        SeedRelations(context, entity1);
        entity1.Tour.TourOperatorId = tourOperatorId;
        
        var entity2 = CreateEntity("Modified Early Manager", baseTime.AddMinutes(-1), baseTime.AddMinutes(-5));
        SeedRelations(context, entity2);
        entity2.Tour.TourOperatorId = tourOperatorId;

        var entity3 = CreateEntity("Modified Mid Manager", baseTime.AddMinutes(-5), baseTime.AddMinutes(0));
        SeedRelations(context, entity3);
        entity3.Tour.TourOperatorId = tourOperatorId;

        context.TourInstances.AddRange(entity1, entity2, entity3);

        // Assign principal as manager for all 3 instances
        context.Set<TourInstanceManagerEntity>().AddRange(
            new TourInstanceManagerEntity { UserId = principalId, TourInstanceId = entity1.Id, CreatedOnUtc = baseTime },
            new TourInstanceManagerEntity { UserId = principalId, TourInstanceId = entity2.Id, CreatedOnUtc = baseTime },
            new TourInstanceManagerEntity { UserId = principalId, TourInstanceId = entity3.Id, CreatedOnUtc = baseTime }
        );

        await context.SaveChangesAsync();

        var repo = new TourInstanceRepository(context);

        // Act
        var result = await repo.FindAll(
            searchText: null,
            status: null,
            pageNumber: 1,
            pageSize: 10,
            excludePast: false,
            wantsCustomization: null,
            instanceType: null,
            principalId: principalId,
            statuses: null,
            cancellationToken: CancellationToken.None);

        // Assert
        Assert.Equal(3, result.Count);
        Assert.Equal("Modified Late Manager", result[0].Title); // LastModifiedOnUtc = +5 mins
        Assert.Equal("Modified Mid Manager", result[1].Title);  // LastModifiedOnUtc = 0 mins
        Assert.Equal("Modified Early Manager", result[2].Title); // LastModifiedOnUtc = -5 mins
    }
}
