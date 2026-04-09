using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourDayConfiguration : IEntityTypeConfiguration<TourDayEntity>
{
    public void Configure(EntityTypeBuilder<TourDayEntity> builder)
    {
        builder.ToTable("TourDays");

        builder.HasKey(d => d.Id);

        // ClassificationId is intentionally nullable (entity declares Guid?) — no IsRequired()
        builder.Property(d => d.ClassificationId);

        builder.Property(d => d.DayNumber)
            .IsRequired();

        builder.Property(d => d.Title)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(d => d.Description)
            .HasMaxLength(2000);

        builder.Property(d => d.Translations)
            .ConfigureTranslationsJsonb();

        builder.HasIndex(d => d.ClassificationId);

        builder.HasMany(d => d.Activities)
            .WithOne(a => a.TourDay)
            .HasForeignKey(a => a.TourDayId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
