using System.Text.Json;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class VisaPolicyConfiguration : IEntityTypeConfiguration<VisaPolicyEntity>
{
    public void Configure(EntityTypeBuilder<VisaPolicyEntity> builder)
    {
        builder.ToTable("VisaPolicies");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Region)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.ProcessingDays)
            .IsRequired();

        builder.Property(x => x.BufferDays)
            .IsRequired();

        builder.Property(x => x.FullPaymentRequired)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.Property(x => x.IsDeleted)
            .IsRequired();

        // Translations as JSONB with explicit conversion
        builder.Property(x => x.Translations)
            .HasColumnType("jsonb")
            .HasConversion(
                value => JsonSerializer.Serialize(value, (JsonSerializerOptions?)null),
                value => JsonSerializer.Deserialize<Dictionary<string, Domain.Entities.Translations.VisaPolicyTranslationData>>(value, (JsonSerializerOptions?)null) ?? new Dictionary<string, Domain.Entities.Translations.VisaPolicyTranslationData>(),
                new ValueComparer<Dictionary<string, Domain.Entities.Translations.VisaPolicyTranslationData>>(
                    (left, right) => JsonSerializer.Serialize(left) == JsonSerializer.Serialize(right),
                    value => JsonSerializer.Serialize(value).GetHashCode(),
                    value => JsonSerializer.Deserialize<Dictionary<string, Domain.Entities.Translations.VisaPolicyTranslationData>>(JsonSerializer.Serialize(value)) ?? new Dictionary<string, Domain.Entities.Translations.VisaPolicyTranslationData>()));

        builder.HasIndex(x => x.Region);
        builder.HasIndex(x => x.IsActive);
        builder.HasIndex(x => x.IsDeleted);
    }
}
