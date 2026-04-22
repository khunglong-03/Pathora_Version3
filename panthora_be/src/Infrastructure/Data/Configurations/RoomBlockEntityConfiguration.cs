namespace Infrastructure.Data.Configurations;

using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class RoomBlockEntityConfiguration : IEntityTypeConfiguration<RoomBlockEntity>
{
    public void Configure(EntityTypeBuilder<RoomBlockEntity> builder)
    {
        builder.ToTable("RoomBlocks");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.RoomType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.BlockedDate)
            .IsRequired();

        builder.Property(x => x.RoomCountBlocked)
            .IsRequired();

        // Non-unique composite index for availability queries (multiple bookings can block same date)
        builder.HasIndex(x => new { x.SupplierId, x.RoomType, x.BlockedDate });

        builder.HasOne(x => x.Supplier)
            .WithMany()
            .HasForeignKey(x => x.SupplierId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.BookingAccommodationDetail)
            .WithMany()
            .HasForeignKey(x => x.BookingAccommodationDetailId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.TourInstanceDayActivity)
            .WithMany()
            .HasForeignKey(x => x.TourInstanceDayActivityId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => x.TourInstanceDayActivityId);
        builder.HasIndex(x => x.HoldStatus);
        builder.HasIndex(x => x.ExpiresAt);
        builder.HasIndex(x => new { x.TourInstanceDayActivityId, x.RoomType })
            .IsUnique()
            .HasFilter("\"TourInstanceDayActivityId\" IS NOT NULL");
    }
}
