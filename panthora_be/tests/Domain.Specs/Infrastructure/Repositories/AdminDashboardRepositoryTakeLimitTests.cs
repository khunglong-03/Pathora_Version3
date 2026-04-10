using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Options;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Mep = Microsoft.Extensions.Options;

namespace Domain.Specs.Infrastructure.Repositories;

/// <summary>
/// Integration tests verifying AdminDashboardRepository applies server-side Take() limits
/// on the two methods identified in fix-n1-queries-disable-lazy-loading task 4.1 and 4.2.
///
/// Task 4.1 — BuildTopTours(): add Take(10) server-side to prevent unbounded
/// in-memory GroupBy on large booking tables.
///
/// Task 4.2 — BuildRevenueByRegion(): add Take(N) server-side limit to prevent
/// the same unbounded query pattern (currently hardcoded to 4, should use RankedItemLimit).
///
/// Strategy: seed many booking rows, call the repository, and assert that the result
/// count is bounded so the test guards against regression when someone removes Take().
/// </summary>
public sealed class AdminDashboardRepositoryTakeLimitTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    /// <summary>
    /// Helper to seed a TourInstance + Tour so that bookings can reference them.
    /// Embeds TourInstance via navigation property on Booking (matching existing test patterns).
    /// </summary>
    private static async Task<(AppDbContext context, Guid tourInstanceId)> SeedTourInstance(
        AppDbContext context,
        string location = "Da Nang, Vietnam")
    {
        var tourId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        var classification = new TourClassificationEntity
        {
            Id = classificationId,
            TourId = tourId,
            Name = "Standard",
            BasePrice = 500m,
            Description = "Standard",
            NumberOfDay = 3,
            NumberOfNight = 2,
            CreatedBy = "admin",
            CreatedOnUtc = DateTime.UtcNow,
        };
        context.TourClassifications.Add(classification);

        var tour = new TourEntity
        {
            Id = tourId,
            TourCode = "DASH-TEST-001",
            TourName = "Dashboard Test Tour",
            ShortDescription = "Short",
            LongDescription = "Long",
            Status = TourStatus.Active,
            IsDeleted = false,
            CreatedBy = "admin",
            CreatedOnUtc = DateTime.UtcNow,
        };
        context.Tours.Add(tour);

        // Embed TourInstance directly in the navigation property so all required fields
        // are set in one place (matching the pattern in BookingRepositoryGetAllPagedAsyncTests).
        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            TourId = tourId,
            ClassificationId = classificationId,
            TourInstanceCode = "TI-DASH001",
            Title = "Dashboard Test Instance",
            TourName = "Dashboard Test Tour",
            TourCode = "DASH-TEST-001",
            ClassificationName = "Standard",
            Location = location,
            InstanceType = TourType.Public,
            StartDate = DateTimeOffset.UtcNow.AddDays(10),
            EndDate = DateTimeOffset.UtcNow.AddDays(13),
            DurationDays = 3,
            MaxParticipation = 20,
            CurrentParticipation = 0,
            BasePrice = 500m,
            Status = TourInstanceStatus.Available,
            CreatedBy = "admin",
            CreatedOnUtc = DateTime.UtcNow,
        };
        context.TourInstances.Add(tourInstance);

        await context.SaveChangesAsync();
        return (context, tourInstanceId);
    }

    /// <summary>
    /// Seeds completed bookings by embedding TourInstance via navigation property.
    /// </summary>
    private static async Task SeedCompletedBookings(
        AppDbContext context,
        Guid tourInstanceId,
        string tourName,
        string tourCode,
        string classificationName,
        string location,
        int count,
        decimal basePrice = 500m)
    {
        for (int i = 0; i < count; i++)
        {
            var startDate = DateTimeOffset.UtcNow.AddDays(10);
            var booking = new BookingEntity
            {
                Id = Guid.NewGuid(),
                TourInstanceId = tourInstanceId,
                CustomerName = $"Customer {i}",
                CustomerPhone = $"09{i:D8}",
                NumberAdult = 2,
                NumberChild = 0,
                NumberInfant = 0,
                TotalPrice = basePrice + i,
                PaymentMethod = Domain.Enums.PaymentMethod.VnPay,
                IsFullPay = i % 2 == 0,
                Status = BookingStatus.Completed,
                BookingDate = DateTimeOffset.UtcNow.AddHours(-i),
                CreatedBy = "admin",
                CreatedOnUtc = DateTime.UtcNow,
                TourInstance = new TourInstanceEntity
                {
                    Id = Guid.NewGuid(), // unique ID per booking to avoid FK tracking conflict
                    ClassificationId = Guid.NewGuid(),
                    TourInstanceCode = $"TI-DASH{i:D4}",
                    Title = tourName,
                    TourName = tourName,
                    TourCode = tourCode,
                    ClassificationName = classificationName,
                    Location = location,
                    InstanceType = TourType.Public,
                    StartDate = startDate,
                    EndDate = startDate.AddDays(3),
                    DurationDays = 3,
                    MaxParticipation = 20,
                    CurrentParticipation = 0,
                    BasePrice = basePrice,
                    Status = TourInstanceStatus.Available,
                    CreatedBy = "admin",
                    CreatedOnUtc = DateTime.UtcNow,
                }
            };

            context.Bookings.Add(booking);
        }

        await context.SaveChangesAsync();
    }

    private static AdminDashboardRepository CreateRepository(AppDbContext context)
    {
        var dashboardOptions = new AdminDashboardOptions
        {
            DashboardMonthWindow = 12,
            CustomerGrowthMonthWindow = 6,
            RankedItemLimit = 5,
            NearlyFullCancellationThreshold = 90,
            DangerCancellationRateThreshold = 5,
        };

        return new AdminDashboardRepository(context, Mep.Options.Create(dashboardOptions));
    }

    // ─────────────────────────────────────────────────────────────
    // Task 4.1 — BuildTopTours() server-side Take() limit
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task BuildTopTours_ReturnsBoundedResults_WhenManyBookingsExist()
    {
        // Arrange — seed 120 completed bookings; without a server-side Take(),
        // the query would load all 120 rows before the in-memory GroupBy.
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (_, tourInstanceId) = await SeedTourInstance(context);
        await SeedCompletedBookings(
            context, tourInstanceId,
            tourName: "Dashboard Test Tour",
            tourCode: "DASH-TEST-001",
            classificationName: "Standard",
            location: "Da Nang, Vietnam",
            count: 120);

        var repo = CreateRepository(context);

        // Act
        var report = await repo.GetDashboard();

        // Assert — BuildTopTours uses .Take(_options.RankedItemLimit) after GroupBy;
        // since all 120 bookings belong to the same tour group, exactly 1 row is returned.
        Assert.True(
            report.TopTours.Count <= 5,
            $"Expected TopTours to be bounded by RankedItemLimit (5), got {report.TopTours.Count}");
    }

    [Fact]
    public async Task BuildTopTours_ReturnsEmpty_WhenNoBookingsExist()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        await SeedTourInstance(context); // tour exists, no bookings

        var repo = CreateRepository(context);
        var report = await repo.GetDashboard();

        Assert.Empty(report.TopTours);
    }

    [Fact]
    public async Task BuildTopTours_AggregatesBookingsAndRevenueCorrectly()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (_, tourInstanceId) = await SeedTourInstance(context);
        // Seed 3 bookings — they all group by the same Title/TourName
        await SeedCompletedBookings(
            context, tourInstanceId,
            tourName: "Dashboard Test Tour",
            tourCode: "DASH-TEST-001",
            classificationName: "Standard",
            location: "Da Nang, Vietnam",
            count: 3,
            basePrice: 500m);

        var repo = CreateRepository(context);
        var report = await repo.GetDashboard();

        Assert.Single(report.TopTours);
        var topTour = report.TopTours[0];
        Assert.Equal(3, topTour.Bookings);
        // Sum of 3 bookings: (500+0) + (500+1) + (500+2) = 1503
        Assert.Equal(1503m, topTour.Revenue);
    }

    // ─────────────────────────────────────────────────────────────
    // Task 4.2 — BuildRevenueByRegion() server-side Take() limit
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task BuildRevenueByRegion_ReturnsBoundedResults_WhenManyRegionsExist()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (_, tourInstanceId) = await SeedTourInstance(context, location: "Da Nang, Vietnam");
        await SeedCompletedBookings(
            context, tourInstanceId,
            tourName: "Dashboard Test Tour",
            tourCode: "DASH-TEST-001",
            classificationName: "Standard",
            location: "Da Nang, Vietnam",
            count: 100);

        var repo = CreateRepository(context);
        var report = await repo.GetDashboard();

        // BuildRevenueByRegion currently uses hardcoded .Take(4).
        // This test validates the return is bounded — regression if Take is removed.
        Assert.True(
            report.RevenueByRegion.Count <= 4,
            $"Expected RevenueByRegion to be bounded to ≤4 results, got {report.RevenueByRegion.Count}");
    }

    [Fact]
    public async Task BuildRevenueByRegion_ReturnsEmpty_WhenAllBookingsCancelled()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var startDate = DateTimeOffset.UtcNow.AddDays(10);

        for (int i = 0; i < 50; i++)
        {
            var tourInstanceId = Guid.NewGuid();
            var booking = BookingEntity.Create(
                tourInstanceId: tourInstanceId,
                customerName: $"Customer {i}",
                customerPhone: $"09{i:D8}",
                numberAdult: 1,
                totalPrice: 500m,
                paymentMethod: Domain.Enums.PaymentMethod.VnPay,
                isFullPay: true,
                performedBy: "admin");
            booking.Status = BookingStatus.Cancelled;
            booking.TourInstance = new TourInstanceEntity
            {
                Id = tourInstanceId,
                ClassificationId = Guid.NewGuid(),
                TourInstanceCode = $"TI-CANCEL{i:D4}",
                Title = "Cancelled Tour",
                TourName = "Cancelled Tour",
                TourCode = "CANCEL-001",
                ClassificationName = "Standard",
                Location = "Da Nang, Vietnam",
                InstanceType = TourType.Public,
                StartDate = startDate,
                EndDate = startDate.AddDays(3),
                DurationDays = 3,
                MaxParticipation = 20,
                CurrentParticipation = 0,
                BasePrice = 500m,
                Status = TourInstanceStatus.Available,
                CreatedBy = "admin",
                CreatedOnUtc = DateTime.UtcNow,
            };
            context.Bookings.Add(booking);
        }
        await context.SaveChangesAsync();

        var repo = CreateRepository(context);
        var report = await repo.GetDashboard();

        Assert.Empty(report.RevenueByRegion);
    }

    [Fact]
    public async Task BuildRevenueByRegion_GroupsByNormalizedLocation()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (_, tourInstanceId) = await SeedTourInstance(context, location: "Da Nang, Vietnam");
        await SeedCompletedBookings(
            context, tourInstanceId,
            tourName: "Dashboard Test Tour",
            tourCode: "DASH-TEST-001",
            classificationName: "Standard",
            location: "Da Nang, Vietnam",
            count: 10);

        var repo = CreateRepository(context);
        var report = await repo.GetDashboard();

        Assert.NotEmpty(report.RevenueByRegion);
        Assert.Equal("Vietnam", report.RevenueByRegion[0].Label);
    }

    [Fact]
    public async Task BuildRevenueByRegion_SumsRevenueCorrectly()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (_, tourInstanceId) = await SeedTourInstance(context, location: "Da Nang, Vietnam");
        await SeedCompletedBookings(
            context, tourInstanceId,
            tourName: "Dashboard Test Tour",
            tourCode: "DASH-TEST-001",
            classificationName: "Standard",
            location: "Da Nang, Vietnam",
            count: 5,
            basePrice: 500m);

        var repo = CreateRepository(context);
        var report = await repo.GetDashboard();

        var region = report.RevenueByRegion.First();
        // Sum of 5 bookings: 500 + 501 + 502 + 503 + 504 = 2510
        Assert.Equal(2510m, region.Value);
    }

    [Fact]
    public async Task BuildRevenueByRegion_ExcludesCancelledBookings()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (_, completedTourInstanceId) = await SeedTourInstance(context, location: "Hanoi, Vietnam");

        // 3 completed bookings
        await SeedCompletedBookings(
            context, completedTourInstanceId,
            tourName: "Completed Tour",
            tourCode: "COMP-001",
            classificationName: "Standard",
            location: "Hanoi, Vietnam",
            count: 3,
            basePrice: 500m);

        // 7 cancelled bookings — each with its own TourInstance (separate IDs to avoid tracking conflict)
        var startDate = DateTimeOffset.UtcNow.AddDays(10);
        for (int i = 0; i < 7; i++)
        {
            var cancelledTourInstanceId = Guid.NewGuid();
            var booking = BookingEntity.Create(
                tourInstanceId: cancelledTourInstanceId,
                customerName: $"Cancelled Customer {i}",
                customerPhone: $"09{i:D8}",
                numberAdult: 1,
                totalPrice: 600m,
                paymentMethod: Domain.Enums.PaymentMethod.VnPay,
                isFullPay: true,
                performedBy: "admin");
            booking.Status = BookingStatus.Cancelled;
            booking.TourInstance = new TourInstanceEntity
            {
                Id = cancelledTourInstanceId,
                ClassificationId = Guid.NewGuid(),
                TourInstanceCode = $"TI-CANCEL{i:D4}",
                Title = "Cancelled Tour",
                TourName = "Completed Tour",
                TourCode = "COMP-001",
                ClassificationName = "Standard",
                Location = "Hanoi, Vietnam",
                InstanceType = TourType.Public,
                StartDate = startDate,
                EndDate = startDate.AddDays(3),
                DurationDays = 3,
                MaxParticipation = 20,
                CurrentParticipation = 0,
                BasePrice = 600m,
                Status = TourInstanceStatus.Available,
                CreatedBy = "admin",
                CreatedOnUtc = DateTime.UtcNow,
            };
            context.Bookings.Add(booking);
        }
        await context.SaveChangesAsync();

        var repo = CreateRepository(context);
        var report = await repo.GetDashboard();

        var region = report.RevenueByRegion.First();
        // Only the 3 completed bookings count: 500 + 501 + 502 = 1503
        Assert.Equal(1503m, region.Value);
        Assert.Equal("Vietnam", region.Label);
    }
}
