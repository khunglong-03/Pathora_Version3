using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourDayActivityRouteTransportEntityConfiguration : IEntityTypeConfiguration<TourDayActivityRouteTransportEntity>
{
    public void Configure(EntityTypeBuilder<TourDayActivityRouteTransportEntity> builder)
    {
        builder.ToTable("TourDayActivityRouteTransports");

        builder.HasKey(x => x.Id);

        builder.HasIndex(x => new { x.BookingActivityReservationId, x.TourDayActivityId })
            .IsUnique();

        builder.HasIndex(x => x.DriverId);
        builder.HasIndex(x => x.VehicleId);
        builder.HasIndex(x => x.Status);

        builder.HasOne(x => x.BookingActivityReservation)
            .WithMany()
            .HasForeignKey(x => x.BookingActivityReservationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.TourDayActivity)
            .WithMany()
            .HasForeignKey(x => x.TourDayActivityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Driver)
            .WithMany()
            .HasForeignKey(x => x.DriverId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.Vehicle)
            .WithMany()
            .HasForeignKey(x => x.VehicleId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(x => x.Status)
            .IsRequired(false);

        builder.Property(x => x.RejectionReason)
            .HasMaxLength(1000)
            .IsRequired(false);
    }
}
