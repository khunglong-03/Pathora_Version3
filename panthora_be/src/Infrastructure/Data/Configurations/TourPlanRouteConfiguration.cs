using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourPlanRouteConfiguration : IEntityTypeConfiguration<TourPlanRouteEntity>
{
    public void Configure(EntityTypeBuilder<TourPlanRouteEntity> builder)
    {
        builder.ToTable("TourPlanRoutes");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Order)
            .IsRequired();

        builder.Property(r => r.TransportationType)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(r => r.TransportationName)
            .HasMaxLength(300);

        builder.Property(r => r.TransportationNote)
            .HasMaxLength(1000);

        builder.Property(r => r.EstimatedDepartureTime);

        builder.Property(r => r.EstimatedArrivalTime);

        builder.Property(r => r.DurationMinutes);

        builder.Property(r => r.Price)
            .HasColumnType("numeric(18,2)");

        builder.Property(r => r.DistanceKm)
            .HasColumnType("numeric(10,2)");

        builder.Property(r => r.BookingReference)
            .HasMaxLength(200);

        builder.Property(r => r.Note)
            .HasMaxLength(1000);

        builder.Property(r => r.Translations)
            .ConfigureTranslationsJsonb();

        builder.HasIndex("TourDayActivityId");
        builder.HasIndex("FromLocationId");
        builder.HasIndex("ToLocationId");

        builder.HasOne(r => r.FromLocation)
            .WithMany()
            .HasForeignKey("FromLocationId")
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasOne(r => r.ToLocation)
            .WithMany()
            .HasForeignKey("ToLocationId")
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        // TourDayActivity required relationship
        builder.HasOne(r => r.TourDayActivity)
            .WithMany()
            .HasForeignKey(r => r.TourDayActivityId)
            .IsRequired();
    }
}
