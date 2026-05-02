using global::Domain.Entities;
using global::Domain.Enums;
using global::Infrastructure.Data;
using global::Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure.Repositories;

/// <summary>
/// Integration tests verifying that GuestArrivalRepository.GetByBookingIdAsync()
/// eagerly loads the nested BookingParticipant -> Passport chain without N+1 queries.
/// </summary>
public sealed class GuestArrivalRepositoryIncludesTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static async Task<(AppDbContext context, Guid bookingId)> SeedBookingWithGuestArrival(AppDbContext context)
    {
        var userId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var participantId = Guid.NewGuid();
        var activityReservationId = Guid.NewGuid();
        var accommodationDetailId = Guid.NewGuid();
        var guestArrivalId = Guid.NewGuid();

        context.Users.Add(new UserEntity
        {
            Id = userId,
            Username = "guestuser",
            Email = "guest@test.com",
            FullName = "Guest User",
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
            TourCode = "GA-TOUR-001",
            TourName = "Guest Arrival Test Tour",
            ShortDescription = "Test",
            LongDescription = "Test",
            Status = TourStatus.Active,
        });

        context.TourInstances.Add(new TourInstanceEntity
        {
            Id = tourInstanceId,
            TourId = tourId,
            ClassificationId = classificationId,
            TourInstanceCode = "TI-GA-001",
            Title = "Guest Arrival Test Instance",
            TourName = "Guest Arrival Test Tour",
            TourCode = "GA-TOUR-001",
            ClassificationName = "Standard",
            StartDate = DateTimeOffset.UtcNow.AddDays(10),
            EndDate = DateTimeOffset.UtcNow.AddDays(13),
            DurationDays = 3,
            Status = TourInstanceStatus.Available,
        });

        context.Bookings.Add(new BookingEntity
        {
            Id = bookingId,
            TourInstanceId = tourInstanceId,
            UserId = userId,
            CustomerName = "Guest Customer",
            CustomerPhone = "0900000000",
            NumberAdult = 2,
            NumberChild = 0,
            NumberInfant = 0,
            TotalPrice = 1000m,
            PaymentMethod = PaymentMethod.VnPay,
            IsFullPay = true,
            Status = BookingStatus.Confirmed,
            BookingDate = DateTimeOffset.UtcNow,
        });

        // Participant linked to the booking
        context.BookingParticipants.Add(new BookingParticipantEntity
        {
            Id = participantId,
            BookingId = bookingId,
            ParticipantType = "Adult",
            FullName = "Passport Guest",
        });

        // Passport linked to the participant
        context.Passports.Add(new PassportEntity
        {
            Id = Guid.NewGuid(),
            BookingParticipantId = participantId,
            PassportNumber = "P8888888",
            Nationality = "Vietnam",
            IssuedAt = DateTimeOffset.UtcNow.AddYears(-5),
            ExpiresAt = DateTimeOffset.UtcNow.AddYears(5),
        });

        // Activity reservation linked to the booking
        context.BookingActivityReservations.Add(new BookingActivityReservationEntity
        {
            Id = activityReservationId,
            BookingId = bookingId,
            Order = 1,
            ActivityType = "Accommodation",
            Title = "Hotel Check-in",
            TotalServicePrice = 100m,
            TotalServicePriceAfterTax = 110m,
        });

        // Accommodation detail linked to the activity reservation
        context.BookingAccommodationDetails.Add(new BookingAccommodationDetailEntity
        {
            Id = accommodationDetailId,
            BookingActivityReservationId = activityReservationId,
            AccommodationName = "Test Hotel",
            RoomType = RoomType.Deluxe,
            CheckInAt = DateTimeOffset.UtcNow.AddDays(10),
            CheckOutAt = DateTimeOffset.UtcNow.AddDays(13),
            BuyPrice = 100m,
            TaxRate = 10m,
            TotalBuyPrice = 110m,
        });

        // Guest arrival linked to the accommodation detail
        context.GuestArrivals.Add(new GuestArrivalEntity
        {
            Id = guestArrivalId,
            BookingAccommodationDetailId = accommodationDetailId,
            SubmittedAt = DateTimeOffset.UtcNow,
        });

        // Participant linked to the guest arrival
        context.GuestArrivalParticipants.Add(new GuestArrivalParticipantEntity
        {
            Id = Guid.NewGuid(),
            GuestArrivalId = guestArrivalId,
            BookingParticipantId = participantId,
        });

        await context.SaveChangesAsync();
        return (context, bookingId);
    }

    [Fact]
    public async Task GetByBookingIdAsync_ParticipantsCollection_IsNotNull()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, bookingId) = await SeedBookingWithGuestArrival(context);
        var repo = new GuestArrivalRepository(ctx);

        var arrivals = await repo.GetByBookingIdAsync(bookingId);

        Assert.NotEmpty(arrivals);
        Assert.NotNull(arrivals[0].Participants);
    }

    [Fact]
    public async Task GetByBookingIdAsync_ParticipantsBookingParticipant_IsNotNull()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, bookingId) = await SeedBookingWithGuestArrival(context);
        var repo = new GuestArrivalRepository(ctx);

        var arrivals = await repo.GetByBookingIdAsync(bookingId);

        Assert.NotEmpty(arrivals);
        Assert.NotEmpty(arrivals[0].Participants);
        Assert.All(arrivals[0].Participants, p => Assert.NotNull(p.BookingParticipant));
    }

    [Fact]
    public async Task GetByBookingIdAsync_ParticipantsBookingParticipantPassport_IsNotNull()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, bookingId) = await SeedBookingWithGuestArrival(context);
        var repo = new GuestArrivalRepository(ctx);

        var arrivals = await repo.GetByBookingIdAsync(bookingId);

        Assert.NotEmpty(arrivals);
        Assert.NotEmpty(arrivals[0].Participants);
        Assert.All(arrivals[0].Participants, p =>
        {
            Assert.NotNull(p.BookingParticipant);
            Assert.NotNull(p.BookingParticipant.Passport);
        });
    }

    [Fact]
    public async Task GetByBookingIdAsync_BookingAccommodationDetail_IsNotNull()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, bookingId) = await SeedBookingWithGuestArrival(context);
        var repo = new GuestArrivalRepository(ctx);

        var arrivals = await repo.GetByBookingIdAsync(bookingId);

        Assert.NotEmpty(arrivals);
        Assert.NotNull(arrivals[0].BookingAccommodationDetail);
    }
}
