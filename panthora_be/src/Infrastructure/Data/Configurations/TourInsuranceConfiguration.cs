using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourInsuranceConfiguration : IEntityTypeConfiguration<TourInsuranceEntity>
{
    public void Configure(EntityTypeBuilder<TourInsuranceEntity> builder)
    {
        builder.ToTable("TourInsurances");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.InsuranceName)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(i => i.InsuranceType)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(i => i.InsuranceProvider)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(i => i.CoverageDescription)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(i => i.CoverageAmount)
            .HasColumnType("numeric(18,2)");

        builder.Property(i => i.CoverageFee)
            .HasColumnType("numeric(18,2)");

        builder.Property(i => i.IsOptional)
            .HasDefaultValue(false);

        builder.Property(i => i.Note)
            .HasMaxLength(1000);

        builder.Property(i => i.Translations)
            .ConfigureTranslationsJsonb();

        builder.Property(i => i.TourClassificationId)
            .IsRequired();

        builder.HasIndex(i => i.TourClassificationId);

        builder.HasOne(i => i.TourClassification)
            .WithMany(c => c.Insurances)
            .HasForeignKey(i => i.TourClassificationId)
            .OnDelete(DeleteBehavior.Cascade);

        // Audit columns
        builder.Property(i => i.CreatedOnUtc);
        builder.Property(i => i.LastModifiedOnUtc);
        builder.Property(i => i.CreatedBy).HasMaxLength(256);
        builder.Property(i => i.IsDeleted).HasDefaultValue(false);
    }
}
