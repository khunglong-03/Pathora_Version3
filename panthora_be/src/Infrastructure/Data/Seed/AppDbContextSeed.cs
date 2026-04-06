using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data.Seed;

public static class AppDbContextSeed
{
    public static Task SeedFreshAsync(AppDbContext context, CancellationToken cancellationToken = default)
    {
        SeedDataPreflightValidator.ValidateRequiredSeedFiles();
        BookingContextSeed.SeedData(context);
        UserRoleSeed.SeedData(context);

        return Task.CompletedTask;
    }

    public static Task<bool> SeedIfNeededAsync(AppDbContext context, CancellationToken cancellationToken = default)
    {
        SeedDataPreflightValidator.ValidateRequiredSeedFiles();
        var seeded = BookingContextSeed.SeedData(context);
        seeded |= SiteContentSeedData.SeedData(context);
        seeded |= UserRoleSeed.SeedData(context);
        return Task.FromResult(seeded);
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
