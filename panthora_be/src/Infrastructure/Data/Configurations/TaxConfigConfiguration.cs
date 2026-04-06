using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TaxConfigConfiguration : IEntityTypeConfiguration<TaxConfigEntity>
{
    public void Configure(EntityTypeBuilder<TaxConfigEntity> builder)
    {
        builder.ToTable("TaxConfigs");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TaxName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.TaxRate)
            .HasPrecision(5, 2);

        builder.Property(t => t.Description)
            .HasMaxLength(500);

        builder.Property(t => t.IsActive)
            .HasDefaultValue(true);

        builder.HasIndex(t => t.IsActive);
        builder.HasIndex(t => t.EffectiveDate);
    }
}
