using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure.Repositories;

public class BookingRepositoryGetAllPagedAsyncTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static async Task SeedBookings(AppDbContext context)
    {
        var classificationId = Guid.NewGuid();
        var tourId = Guid.NewGuid();

        var classification = new TourClassificationEntity
        {
            Id = classificationId,
            TourId = tourId,
            Name = "Budget",
            BasePrice = 1000m,
            Description = "Budget classification",
            NumberOfDay = 3,
            NumberOfNight = 2,
            IsDeleted = false,
            CreatedBy = "admin",
            CreatedOnUtc = DateTime.UtcNow,
        };
        context.TourClassifications.Add(classification);

        var tour = new TourEntity
        {
            Id = tourId,
            TourCode = "TOUR-001",
            TourName = "Test Tour",
            ShortDescription = "Short",
            LongDescription = "Long",
            Status = TourStatus.Active,
            IsDeleted = false,
            CreatedBy = "admin",
            CreatedOnUtc = DateTime.UtcNow,
        };
        context.Tours.Add(tour);

        // Seed 5 bookings with different dates
        for (int i = 0; i < 5; i++)
        {
            var startDate = DateTimeOffset.UtcNow.AddDays(10 + i);
            var booking = new BookingEntity
            {
                Id = Guid.NewGuid(),
                TourInstanceId = Guid.NewGuid(),
                CustomerName = $"Customer {i}",
                CustomerPhone = $"090000000{i}",
                NumberAdult = 2,
                NumberChild = 0,
                NumberInfant = 0,
                TotalPrice = 1000m * (i + 1),
                PaymentMethod = PaymentMethod.VnPay,
                IsFullPay = true,
                Status = i % 2 == 0 ? BookingStatus.Confirmed : BookingStatus.Pending,
                BookingDate = DateTimeOffset.UtcNow.AddHours(-i),
                CreatedBy = "admin",
                CreatedOnUtc = DateTime.UtcNow,
                TourInstance = new TourInstanceEntity
                {
                    Id = Guid.NewGuid(),
                    TourId = tourId,
                    ClassificationId = classificationId,
                    TourInstanceCode = $"TI-00{i}",
                    Title = $"Tour Instance {i}",
                    TourName = $"Tour {i}",
                    TourCode = $"TC-00{i}",
                    ClassificationName = "Budget",
                    StartDate = startDate,
                    EndDate = startDate.AddDays(3),
                    DurationDays = 3,
                    Status = TourInstanceStatus.Available,
                    CreatedBy = "admin",
                    CreatedOnUtc = DateTime.UtcNow,
                }
            };
            context.Bookings.Add(booking);
        }

        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task GetAllPagedAsync_ShouldReturnCorrectPage()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        await SeedBookings(context);
        var repo = new BookingRepository(context);

        var (items, totalCount) = await repo.GetAllPagedAsync(page: 1, pageSize: 3);

        Assert.Equal(5, totalCount);
        Assert.Equal(3, items.Count);
    }

    [Fact]
    public async Task GetAllPagedAsync_ShouldReturnCorrectPage2()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        await SeedBookings(context);
        var repo = new BookingRepository(context);

        var (items, totalCount) = await repo.GetAllPagedAsync(page: 2, pageSize: 3);

        Assert.Equal(5, totalCount);
        Assert.Equal(2, items.Count);
    }

    [Fact]
    public async Task GetAllPagedAsync_ShouldReturnEmptyWhenPageBeyondData()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        await SeedBookings(context);
        var repo = new BookingRepository(context);

        var (items, totalCount) = await repo.GetAllPagedAsync(page: 99, pageSize: 20);

        Assert.Equal(5, totalCount);
        Assert.Empty(items);
    }

    [Fact]
    public async Task GetAllPagedAsync_ShouldOrderByBookingDateDescending()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        await SeedBookings(context);
        var repo = new BookingRepository(context);

        var (items, _) = await repo.GetAllPagedAsync(page: 1, pageSize: 5);

        for (int i = 0; i < items.Count - 1; i++)
        {
            Assert.True(items[i].BookingDate >= items[i + 1].BookingDate);
        }
    }

    [Fact]
    public async Task GetAllPagedAsync_ShouldReturnTotalCountAcrossAllPages()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        await SeedBookings(context);
        var repo = new BookingRepository(context);

        var (items, totalCount) = await repo.GetAllPagedAsync(page: 1, pageSize: 2);

        Assert.Equal(5, totalCount);
        Assert.Equal(2, items.Count);
    }
}
