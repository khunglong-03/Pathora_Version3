using System.Text.Json;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class DepositPolicyConfiguration : IEntityTypeConfiguration<DepositPolicyEntity>
{
    public void Configure(EntityTypeBuilder<DepositPolicyEntity> builder)
    {
        builder.ToTable("DepositPolicies");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.TourScope)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.DepositType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.DepositValue)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(x => x.MinDaysBeforeDeparture)
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
                value => JsonSerializer.Deserialize<Dictionary<string, Domain.Entities.Translations.DepositPolicyTranslationData>>(value, (JsonSerializerOptions?)null) ?? new Dictionary<string, Domain.Entities.Translations.DepositPolicyTranslationData>(),
                new ValueComparer<Dictionary<string, Domain.Entities.Translations.DepositPolicyTranslationData>>(
                    (left, right) => JsonSerializer.Serialize(left) == JsonSerializer.Serialize(right),
                    value => JsonSerializer.Serialize(value).GetHashCode(),
                    value => JsonSerializer.Deserialize<Dictionary<string, Domain.Entities.Translations.DepositPolicyTranslationData>>(JsonSerializer.Serialize(value)) ?? new Dictionary<string, Domain.Entities.Translations.DepositPolicyTranslationData>()));

        builder.HasIndex(x => x.TourScope);
        builder.HasIndex(x => x.IsActive);
        builder.HasIndex(x => x.IsDeleted);
    }
}
