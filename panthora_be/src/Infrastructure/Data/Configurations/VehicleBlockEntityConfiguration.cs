using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class VehicleBlockEntityConfiguration : IEntityTypeConfiguration<VehicleBlockEntity>
{
    public void Configure(EntityTypeBuilder<VehicleBlockEntity> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Vehicle)
            .WithMany()
            .HasForeignKey(x => x.VehicleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.TourInstanceDayActivity)
            .WithMany()
            .HasForeignKey(x => x.TourInstanceDayActivityId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.BookingActivityReservation)
            .WithMany()
            .HasForeignKey(x => x.BookingActivityReservationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => new { x.VehicleId, x.BlockedDate, x.HoldStatus })
            .HasFilter($"\"HoldStatus\" = {(int)HoldStatus.Hard}")
            .IsUnique();

        builder.HasIndex(x => x.VehicleId);
        builder.HasIndex(x => x.BlockedDate);
        builder.HasIndex(x => x.ExpiresAt);

        builder.HasQueryFilter(x => !x.Vehicle.IsDeleted && x.Vehicle.IsActive && x.Vehicle.Owner.Status == Domain.Enums.UserStatus.Active);
    }
}
