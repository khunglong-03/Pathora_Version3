using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TicketImageConfiguration : IEntityTypeConfiguration<TicketImageEntity>
{
    public void Configure(EntityTypeBuilder<TicketImageEntity> builder)
    {
        builder.ToTable("TicketImages");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TourInstanceDayActivityId)
            .IsRequired();

        builder.HasOne(t => t.TourInstanceDayActivity)
            .WithMany(a => a.TicketImages)
            .HasForeignKey(t => t.TourInstanceDayActivityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.TourInstanceDayActivityId);

        builder.OwnsOne(t => t.Image, image =>
        {
            image.Property(i => i.FileId).HasMaxLength(200);
            image.Property(i => i.OriginalFileName).HasMaxLength(300);
            image.Property(i => i.FileName).HasMaxLength(300);
            image.Property(i => i.PublicURL).HasMaxLength(1000);
        });

        builder.Property(t => t.UploadedBy)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(t => t.UploadedAt)
            .IsRequired();

        builder.Property(t => t.BookingId);

        builder.HasOne(t => t.Booking)
            .WithMany()
            .HasForeignKey(t => t.BookingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(t => t.BookingId);

        builder.Property(t => t.BookingReference)
            .HasMaxLength(200);

        builder.Property(t => t.Note)
            .HasMaxLength(1000);
    }
}
