using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourDayActivityStatusConfiguration : IEntityTypeConfiguration<TourDayActivityStatusEntity>
{
    public void Configure(EntityTypeBuilder<TourDayActivityStatusEntity> builder)
    {
        builder.ToTable("TourDayActivityStatuses");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ActivityStatus)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.CancellationReason)
            .HasMaxLength(2000);

        builder.Property(x => x.Note)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.BookingId);
        builder.HasIndex(x => x.TourDayId);
        builder.HasIndex(x => new { x.BookingId, x.TourDayId }).IsUnique();

        builder.HasOne(x => x.Booking)
            .WithMany(x => x.TourDayActivityStatuses)
            .HasForeignKey(x => x.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.TourDay)
            .WithMany(x => x.ActivityStatuses)
            .HasForeignKey(x => x.TourDayId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
