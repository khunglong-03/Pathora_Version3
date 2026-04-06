using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourClassificationConfiguration : IEntityTypeConfiguration<TourClassificationEntity>
{
    public void Configure(EntityTypeBuilder<TourClassificationEntity> builder)
    {
        builder.ToTable("TourClassifications");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.TourId)
            .IsRequired();

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.BasePrice)
            .IsRequired()
            .HasColumnType("numeric(18,2)");

        builder.Property(c => c.Description)
            .IsRequired();

        builder.Property(c => c.Translations)
            .ConfigureTranslationsJsonb();

        builder.Property(c => c.NumberOfDay)
            .IsRequired();

        builder.Property(c => c.NumberOfNight)
            .IsRequired();

        builder.HasIndex(c => c.TourId);

        builder.HasMany(c => c.Plans)
            .WithOne(d => d.Classification)
            .HasForeignKey(d => d.ClassificationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
