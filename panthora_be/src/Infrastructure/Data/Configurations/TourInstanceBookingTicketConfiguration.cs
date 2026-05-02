using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourInstanceBookingTicketConfiguration : IEntityTypeConfiguration<TourInstanceBookingTicketEntity>
{
    public void Configure(EntityTypeBuilder<TourInstanceBookingTicketEntity> builder)
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

        builder.Property(t => t.FlightNumber).HasMaxLength(100);
        builder.Property(t => t.SeatNumbers).HasMaxLength(500);
        builder.Property(t => t.ETicketNumbers).HasMaxLength(500);
        builder.Property(t => t.SeatClass).HasMaxLength(100);
        builder.Property(t => t.Note).HasMaxLength(1000);
    }
}
