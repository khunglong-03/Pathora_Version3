using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourInstanceDayActivityConfiguration : IEntityTypeConfiguration<TourInstanceDayActivityEntity>
{
    public void Configure(EntityTypeBuilder<TourInstanceDayActivityEntity> builder)
    {
        builder.ToTable("TourInstanceDayActivities");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.TourInstanceDayId)
            .IsRequired();

        builder.Property(a => a.Order)
            .IsRequired();

        builder.Property(a => a.ActivityType)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(a => a.Description)
            .HasMaxLength(2000);

        builder.Property(a => a.Note)
            .HasMaxLength(1000);

        builder.HasIndex(a => a.TourInstanceDayId);

        builder.Property(a => a.IsOptional)
            .HasDefaultValue(false);

        builder.Property(a => a.StartTime);
        builder.Property(a => a.EndTime);

        builder.HasMany(a => a.Routes)
            .WithOne(r => r.TourInstanceDayActivity)
            .HasForeignKey(r => r.TourInstanceDayActivityId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Accommodation)
            .WithOne(acc => acc.TourInstanceDayActivity)
            .HasForeignKey<TourInstancePlanAccommodationEntity>(acc => acc.TourInstanceDayActivityId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
