using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourPlanLocationConfiguration : IEntityTypeConfiguration<TourPlanLocationEntity>
{
    public void Configure(EntityTypeBuilder<TourPlanLocationEntity> builder)
    {
        builder.ToTable("TourPlanLocations");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.LocationName)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(l => l.LocationDescription)
            .HasMaxLength(2000);

        builder.Property(l => l.LocationType)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(l => l.Address)
            .HasMaxLength(500);

        builder.Property(l => l.City)
            .HasMaxLength(200);

        builder.Property(l => l.Country)
            .HasMaxLength(200);

        builder.Property(l => l.Latitude)
            .HasColumnType("numeric(10,7)");

        builder.Property(l => l.Longitude)
            .HasColumnType("numeric(10,7)");

        builder.Property(l => l.EntranceFee)
            .HasColumnType("numeric(18,2)");

        builder.Property(l => l.OpeningHours);

        builder.Property(l => l.ClosingHours);

        builder.Property(l => l.EstimatedDurationMinutes);

        builder.Property(l => l.Note)
            .HasMaxLength(1000);

        builder.Property(l => l.Translations)
            .ConfigureTranslationsJsonb();

        builder.Property(l => l.TourDayActivityId)
            .IsRequired(false);

        builder.HasIndex(l => l.TourDayActivityId);

        builder.HasOne(l => l.TourDayActivity)
            .WithMany()
            .HasForeignKey(l => l.TourDayActivityId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(l => l.TourId).IsRequired();

        builder.HasOne(l => l.Tour)
            .WithMany()
            .HasForeignKey(l => l.TourId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(l => l.TourId);

        builder.HasIndex(l => new { l.City, l.Country });
        builder.HasIndex(l => l.LocationType);
    }
}
