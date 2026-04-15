using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourInstancePlanRouteConfiguration : IEntityTypeConfiguration<TourInstancePlanRouteEntity>
{
    public void Configure(EntityTypeBuilder<TourInstancePlanRouteEntity> builder)
    {
        builder.ToTable("TourInstancePlanRoutes");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.PickupLocation)
            .HasMaxLength(500);

        builder.Property(e => e.DropoffLocation)
            .HasMaxLength(500);

        builder.Property(e => e.DepartureTime);
        builder.Property(e => e.ArrivalTime);

        builder.HasOne(e => e.Vehicle)
            .WithMany()
            .HasForeignKey(e => e.VehicleId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
