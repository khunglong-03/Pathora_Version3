using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourItineraryFeedbackConfiguration : IEntityTypeConfiguration<TourItineraryFeedbackEntity>
{
    public void Configure(EntityTypeBuilder<TourItineraryFeedbackEntity> builder)
    {
        builder.ToTable("TourItineraryFeedbacks");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Content)
            .IsRequired()
            .HasMaxLength(8000);

        builder.HasOne(f => f.TourInstanceDay)
            .WithMany()
            .HasForeignKey(f => f.TourInstanceDayId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(f => f.Booking)
            .WithMany()
            .HasForeignKey(f => f.BookingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(f => f.RowVersion)
            .IsRowVersion();

        builder.HasIndex(f => f.TourInstanceId);
        builder.HasIndex(f => f.TourInstanceDayId);
        builder.HasIndex(f => f.BookingId);
        builder.HasIndex(f => f.Status);
        builder.HasIndex(f => new { f.TourInstanceId, f.TourInstanceDayId });
    }
}
