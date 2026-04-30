using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourInstanceBookingRoomAssignmentConfiguration : IEntityTypeConfiguration<TourInstanceBookingRoomAssignmentEntity>
{
    public void Configure(EntityTypeBuilder<TourInstanceBookingRoomAssignmentEntity> builder)
    {
        builder.HasKey(t => t.Id);

        builder.HasOne(t => t.TourInstanceDayActivity)
            .WithMany()
            .HasForeignKey(t => t.TourInstanceDayActivityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Booking)
            .WithMany()
            .HasForeignKey(t => t.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(t => t.RoomType).HasConversion<int>();
        builder.Property(t => t.RoomNumbers).HasMaxLength(500);
        builder.Property(t => t.Note).HasMaxLength(1000);

        builder.HasIndex(t => new { t.TourInstanceDayActivityId, t.BookingId })
            .IsUnique();
    }
}
