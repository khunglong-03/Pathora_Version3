using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourInstanceTransportAssignmentEntityConfiguration : IEntityTypeConfiguration<TourInstanceTransportAssignmentEntity>
{
    public void Configure(EntityTypeBuilder<TourInstanceTransportAssignmentEntity> builder)
    {
        builder.ToTable("TourInstanceTransportAssignments");

        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.TourInstanceDayActivityId);
        builder.HasIndex(x => x.VehicleId);

        // Manager-driven mode: 1 vehicle record with quantity>1 = multiple physical vehicles.
        // Multiple assignment rows can share vehicleId but MUST have different driverIds.
        builder.HasIndex(x => new { x.TourInstanceDayActivityId, x.VehicleId, x.DriverId })
            .IsUnique();

        builder.HasOne(x => x.TourInstanceDayActivity)
            .WithMany(a => a.TransportAssignments)
            .HasForeignKey(x => x.TourInstanceDayActivityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Vehicle)
            .WithMany()
            .HasForeignKey(x => x.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Driver)
            .WithMany()
            .HasForeignKey(x => x.DriverId)
            .OnDelete(DeleteBehavior.Restrict);

        // Matching query filter mirrors VehicleEntityConfiguration so EF does not warn about
        // required-navigation + filter mismatch. Assignments whose Vehicle is soft-deleted,
        // deactivated, or owned by a banned user are filtered out of default queries; pull
        // via `.IgnoreQueryFilters()` when auditing historical data.
        builder.HasQueryFilter(x =>
            !x.Vehicle.IsDeleted
            && x.Vehicle.IsActive
            && x.Vehicle.Owner.Status == Domain.Enums.UserStatus.Active);
    }
}
