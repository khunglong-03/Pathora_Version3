using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data.Seed;

public static class AppDbContextSeed
{
    public static Task SeedFreshAsync(AppDbContext context, CancellationToken cancellationToken = default)
    {
        SeedDataPreflightValidator.ValidateRequiredSeedFiles();
        BookingContextSeed.SeedData(context);
        UserRoleSeed.SeedData(context);
        SeedPolicies(context);
        SeedSuppliers(context);
        SeedVehiclesDriversRooms(context);
        SeedTourContent(context);
        SeedTourInstances(context);
        SeedBookings(context);
        SeedReviews(context);

        return Task.CompletedTask;
    }

    public static Task<bool> SeedIfNeededAsync(AppDbContext context, CancellationToken cancellationToken = default)
    {
        SeedDataPreflightValidator.ValidateRequiredSeedFiles();
        var seeded = BookingContextSeed.SeedData(context);
        seeded |= SiteContentSeedData.SeedData(context);
        seeded |= UserRoleSeed.SeedData(context);
        seeded |= SeedPolicies(context);
        seeded |= SeedSuppliers(context);
        seeded |= SeedVehiclesDriversRooms(context);
        seeded |= SeedTourContent(context);
        seeded |= SeedTourInstances(context);
        seeded |= SeedBookings(context);
        seeded |= SeedReviews(context);
        return Task.FromResult(seeded);
    }

    // Layer 1: Policies
    private static bool SeedPolicies(AppDbContext context)
    {
        var seeded = false;
        seeded |= SeedTable(context, "tax-config.json", context.TaxConfigs);
        seeded |= SeedTable(context, "pricing-policy.json", context.PricingPolicies);
        seeded |= SeedTable(context, "cancellation-policy.json", context.CancellationPolicies);
        seeded |= SeedTable(context, "deposit-policy.json", context.DepositPolicies);
        seeded |= SeedTable(context, "visa-policy.json", context.VisaPolicies);
        seeded |= SeedTable(context, "department.json", context.Departments);
        seeded |= SeedTable(context, "position.json", context.Positions);
        return seeded;
    }

    // Layer 2: Suppliers
    private static bool SeedSuppliers(AppDbContext context)
    {
        var seeded = false;
        seeded |= SeedTable(context, "supplier-transport.json", context.Suppliers);
        seeded |= SeedAppendTable(context, "supplier-hotel.json", context.Suppliers);
        seeded |= SeedAppendTable(context, "supplier-activity.json", context.Suppliers);
        return seeded;
    }

    // Layer 3: Vehicles, Drivers, Hotel Rooms
    private static bool SeedVehiclesDriversRooms(AppDbContext context)
    {
        var seeded = false;
        seeded |= SeedTable(context, "vehicle.json", context.Vehicles);
        seeded |= SeedTable(context, "driver.json", context.Drivers);
        seeded |= SeedTable(context, "hotel-room-inventory.json", context.HotelRoomInventories);
        return seeded;
    }

    // Layer 4: Tour content
    private static bool SeedTourContent(AppDbContext context)
    {
        var seeded = false;
        seeded |= SeedTable(context, "tour.json", context.Tours);
        seeded |= SeedTable(context, "tour-classification.json", context.TourClassifications);
        seeded |= SeedTable(context, "tour-day.json", context.TourDays);
        seeded |= SeedTable(context, "tour-day-activity.json", context.TourDayActivities);
        seeded |= SeedTable(context, "tour-plan-location.json", context.TourPlanLocations);
        seeded |= SeedTable(context, "tour-plan-accommodation.json", context.TourPlanAccommodations);
        seeded |= SeedTable(context, "tour-plan-route.json", context.TourPlanRoutes);
        return seeded;
    }

    // Layer 5: Tour Instances
    private static bool SeedTourInstances(AppDbContext context)
    {
        return SeedTable(context, "tour-instance.json", context.TourInstances);
    }

    // Layer 6: Bookings
    private static bool SeedBookings(AppDbContext context)
    {
        var seeded = false;
        seeded |= SeedTable(context, "booking.json", context.Bookings);
        seeded |= SeedTable(context, "booking-participant.json", context.BookingParticipants);
        seeded |= SeedTable(context, "booking-activity-reservation.json", context.BookingActivityReservations);
        seeded |= SeedTable(context, "booking-transport-detail.json", context.BookingTransportDetails);
        seeded |= SeedTable(context, "booking-accommodation-detail.json", context.BookingAccommodationDetails);
        seeded |= SeedTable(context, "booking-tour-guide.json", context.BookingTourGuides);
        return seeded;
    }

    // Layer 7: Reviews
    private static bool SeedReviews(AppDbContext context)
    {
        return SeedTable(context, "review.json", context.Reviews);
    }

    private static bool SeedTable<T>(AppDbContext context, string fileName, Microsoft.EntityFrameworkCore.DbSet<T> dbSet) where T : class
    {
        if (dbSet.Any()) return false;

        var data = SeedDataLoader.LoadData<T>(fileName);
        if (data is { Count: > 0 })
        {
            dbSet.AddRange(data);
            context.SaveChanges();
            return true;
        }

        return false;
    }

    private static bool SeedAppendTable<T>(AppDbContext context, string fileName, Microsoft.EntityFrameworkCore.DbSet<T> dbSet) where T : class
    {
        var data = SeedDataLoader.LoadData<T>(fileName);
        if (data is { Count: > 0 })
        {
            dbSet.AddRange(data);
            context.SaveChanges();
            return true;
        }

        return false;
    }

    private static async Task SaveChangesUtcAsync(AppDbContext context, CancellationToken cancellationToken)
    {
        NormalizeDateTimeOffsetValuesToUtc(context);
        await context.SaveChangesAsync(cancellationToken);
    }

    private static void NormalizeDateTimeOffsetValuesToUtc(AppDbContext context)
    {
        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.State is not EntityState.Added and not EntityState.Modified)
            {
                continue;
            }

            foreach (var property in entry.Properties)
            {
                if (property.Metadata.ClrType == typeof(DateTimeOffset) && property.CurrentValue is DateTimeOffset value)
                {
                    property.CurrentValue = value.ToUniversalTime();
                }

                if (property.Metadata.ClrType == typeof(DateTimeOffset?) && property.CurrentValue is DateTimeOffset nullableValue)
                {
                    property.CurrentValue = nullableValue.ToUniversalTime();
                }
            }
        }
    }
}
