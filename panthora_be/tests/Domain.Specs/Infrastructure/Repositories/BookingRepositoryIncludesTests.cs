using global::Domain.Entities;
using global::Domain.Enums;
using global::Infrastructure.Data;
using global::Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure.Repositories;

/// <summary>
/// Integration tests verifying that BookingRepository.GetAllPagedAsync()
/// eagerly loads all required navigation properties to prevent N+1 queries.
/// </summary>
public sealed class BookingRepositoryIncludesTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static async Task SeedBookingWithAllNavigations(AppDbContext context)
    {
        var userId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        context.Users.Add(new UserEntity
        {
            Id = userId,
            Username = "bookinguser",
            Email = "booking@test.com",
            FullName = "Booking User",
            Status = UserStatus.Active,
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
        });

        context.Tours.Add(new TourEntity
        {
            Id = tourId,
            TourCode = "INC-TOUR-001",
            TourName = "Include Test Tour",
            ShortDescription = "Test",
            LongDescription = "Test",
            Status = TourStatus.Active,
        });

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            TourId = tourId,
            ClassificationId = classificationId,
            TourInstanceCode = "TI-INC-001",
            Title = "Include Test Instance",
            TourName = "Include Test Tour",
            TourCode = "INC-TOUR-001",
            ClassificationName = "Standard",
            StartDate = DateTimeOffset.UtcNow.AddDays(10),
            EndDate = DateTimeOffset.UtcNow.AddDays(13),
            DurationDays = 3,
            MaxParticipation = 30,
            BasePrice = 1000m,
            Status = TourInstanceStatus.Available,
        };
        context.TourInstances.Add(tourInstance);

        var participantId = Guid.NewGuid();
        var activityReservationId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var booking = new BookingEntity
        {
            Id = bookingId,
            TourInstanceId = tourInstanceId,
            UserId = userId,
            CustomerName = "Customer",
            CustomerPhone = "0900000000",
            NumberAdult = 2,
            NumberChild = 0,
            NumberInfant = 0,
            TotalPrice = 1000m,
            PaymentMethod = PaymentMethod.VnPay,
            IsFullPay = true,
            Status = BookingStatus.Confirmed,
            BookingDate = DateTimeOffset.UtcNow,
            TourInstance = tourInstance,
        };
        booking.BookingParticipants.Add(new BookingParticipantEntity
        {
            Id = participantId,
            ParticipantType = "Adult",
            FullName = "Test Participant",
        });
        booking.BookingActivityReservations.Add(new BookingActivityReservationEntity
        {
            Id = activityReservationId,
            Order = 1,
            ActivityType = "DayTour",
            Title = "Test Activity",
            TotalServicePrice = 100m,
            TotalServicePriceAfterTax = 110m,
        });
        context.Bookings.Add(booking);

        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task GetAllPagedAsync_TourInstance_IsNotNull()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        await SeedBookingWithAllNavigations(context);
        var repo = new BookingRepository(context);

        var (items, _) = await repo.GetAllPagedAsync(page: 1, pageSize: 10);

        Assert.NotEmpty(items);
        Assert.NotNull(items[0].TourInstance);
    }

    [Fact]
    public async Task GetAllPagedAsync_User_IsNotNull()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        await SeedBookingWithAllNavigations(context);
        var repo = new BookingRepository(context);

        var (items, _) = await repo.GetAllPagedAsync(page: 1, pageSize: 10);

        Assert.NotEmpty(items);
        Assert.NotNull(items[0].User);
    }

    [Fact]
    public async Task GetAllPagedAsync_BookingParticipants_IsLoaded()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        await SeedBookingWithAllNavigations(context);
        var repo = new BookingRepository(context);

        var (items, _) = await repo.GetAllPagedAsync(page: 1, pageSize: 10);

        Assert.NotEmpty(items);
        var participants = items[0].BookingParticipants;
        Assert.NotNull(participants);
    }

    [Fact]
    public async Task GetAllPagedAsync_BookingActivityReservations_IsLoaded()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        await SeedBookingWithAllNavigations(context);
        var repo = new BookingRepository(context);

        var (items, _) = await repo.GetAllPagedAsync(page: 1, pageSize: 10);

        Assert.NotEmpty(items);
        var reservations = items[0].BookingActivityReservations;
        Assert.NotNull(reservations);
    }

    [Fact]
    public async Task GetAllPagedAsync_BookingTourGuides_IsLoaded()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        await SeedBookingWithAllNavigations(context);
        var repo = new BookingRepository(context);

        var (items, _) = await repo.GetAllPagedAsync(page: 1, pageSize: 10);

        Assert.NotEmpty(items);
        var guides = items[0].BookingTourGuides;
        Assert.NotNull(guides);
    }
}
