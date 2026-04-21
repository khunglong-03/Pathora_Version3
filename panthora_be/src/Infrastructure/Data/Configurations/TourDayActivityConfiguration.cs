using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourDayActivityConfiguration : IEntityTypeConfiguration<TourDayActivityEntity>
{
    public void Configure(EntityTypeBuilder<TourDayActivityEntity> builder)
    {
        builder.ToTable("TourDayActivities");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.TourDayId)
            .IsRequired();

        builder.Property(a => a.Order)
            .IsRequired();

        builder.Property(a => a.ActivityType)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(a => a.Description)
            .HasMaxLength(2000);

        builder.Property(a => a.Note)
            .HasMaxLength(1000);

        builder.Property(a => a.Translations)
            .ConfigureTranslationsJsonb();

        builder.HasIndex(a => a.TourDayId);

        builder.Property(a => a.EstimatedCost)
            .HasColumnType("numeric(18,2)");

        builder.Property(a => a.IsOptional)
            .HasDefaultValue(false);

        builder.Property(a => a.StartTime);

        builder.Property(a => a.EndTime);

        builder.HasOne(a => a.FromLocation)
            .WithMany()
            .HasForeignKey(a => a.FromLocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.ToLocation)
            .WithMany()
            .HasForeignKey(a => a.ToLocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(a => a.TransportationType)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(a => a.TransportationName)
            .HasMaxLength(300);

        builder.Property(a => a.Price)
            .HasColumnType("numeric(18,2)");

        builder.Property(a => a.DistanceKm)
            .HasColumnType("numeric(10,2)");

        builder.Property(a => a.BookingReference)
            .HasMaxLength(200);

        builder.HasOne(a => a.Accommodation)
            .WithOne(acc => acc.TourDayActivity)
            .HasForeignKey<TourPlanAccommodationEntity>("TourDayActivityId")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
