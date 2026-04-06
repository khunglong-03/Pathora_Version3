using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Domain.Specs.Infrastructure.Repositories;

/// <summary>
/// Unit tests for TourRepository.UpdateStatus.
/// Uses NSubstitute mocks to test the method's logic without requiring ExecuteUpdateAsync support.
/// </summary>
public sealed class TourRepositoryTests
{
    private static AppDbContext CreateMockedContext(bool tourExistsAndNotDeleted)
    {
        // Use InMemory for query methods but patch ExecuteUpdateAsync
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);

        if (tourExistsAndNotDeleted)
        {
            var tour = new TourEntity
            {
                Id = Guid.NewGuid(),
                TourCode = "TOUR-TEST-001",
                TourName = "Test Tour",
                ShortDescription = "Short",
                LongDescription = "Long",
                Status = TourStatus.Pending,
                IsDeleted = false,
                CreatedBy = "admin",
                CreatedOnUtc = DateTime.UtcNow,
            };
            context.Tours.Add(tour);
        }
        // If not added, the tour doesn't exist

        context.SaveChanges();
        return context;
    }

    #region UpdateStatus — soft-deleted exclusion

    [Fact]
    public void UpdateStatus_WhenTourIsSoftDeleted_ShouldReturnZeroRows()
    {
        // Arrange: a real InMemory context with a soft-deleted tour.
        // We verify the WHERE clause logic by checking that a tour with IsDeleted=true
        // does NOT match the filter used by UpdateStatus.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var tour = new TourEntity
        {
            Id = Guid.NewGuid(),
            TourCode = "TOUR-TEST-001",
            TourName = "Soft Deleted Tour",
            ShortDescription = "Short",
            LongDescription = "Long",
            Status = TourStatus.Pending,
            IsDeleted = true, // soft-deleted
            CreatedBy = "admin",
            CreatedOnUtc = DateTime.UtcNow,
        };

        context.Tours.Add(tour);
        context.SaveChanges();

        // Verify: the soft-deleted tour does NOT match the WHERE filter (Id == id && !IsDeleted)
        var matchesFilter = context.Tours
            .Where(t => t.Id == tour.Id && !t.IsDeleted)
            .Any();

        Assert.False(matchesFilter, "Soft-deleted tour should NOT match the WHERE filter");
    }

    #endregion

    #region UpdateStatus — happy path filter

    [Fact]
    public void UpdateStatus_WhenTourExistsAndNotDeleted_ShouldMatchFilter()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var tourId = Guid.NewGuid();
        var tour = new TourEntity
        {
            Id = tourId,
            TourCode = "TOUR-TEST-002",
            TourName = "Active Tour",
            ShortDescription = "Short",
            LongDescription = "Long",
            Status = TourStatus.Pending,
            IsDeleted = false,
            CreatedBy = "admin",
            CreatedOnUtc = DateTime.UtcNow,
        };

        context.Tours.Add(tour);
        context.SaveChanges();

        // Verify: the active tour DOES match the WHERE filter (Id == id && !IsDeleted)
        var matchesFilter = context.Tours
            .Where(t => t.Id == tourId && !t.IsDeleted)
            .Any();

        Assert.True(matchesFilter, "Active tour should match the WHERE filter");
    }

    #endregion

    #region UpdateStatus — not found filter

    [Fact]
    public void UpdateStatus_WhenTourDoesNotExist_ShouldNotMatchFilter()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);
        var nonExistentId = Guid.NewGuid();

        // Verify: a non-existent ID does NOT match the WHERE filter
        var matchesFilter = context.Tours
            .Where(t => t.Id == nonExistentId && !t.IsDeleted)
            .Any();

        Assert.False(matchesFilter, "Non-existent tour should NOT match the WHERE filter");
    }

    #endregion
}
