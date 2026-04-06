using System.Text.Json;
using Domain.Entities;
using Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class CancellationPolicyEntityConfiguration : IEntityTypeConfiguration<CancellationPolicyEntity>
{
    public void Configure(EntityTypeBuilder<CancellationPolicyEntity> builder)
    {
        builder.ToTable("CancellationPolicies");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.PolicyCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(p => p.PolicyCode)
            .IsUnique();

        builder.Property(p => p.TourScope)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(p => p.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(Domain.Enums.CancellationPolicyStatus.Active)
            .HasSentinel(Domain.Enums.CancellationPolicyStatus.None)
            .IsRequired();

        builder.Property(p => p.IsDeleted)
            .HasDefaultValue(false);

        // Tiers as JSONB with explicit conversion
        builder.Property(p => p.Tiers)
            .HasColumnType("jsonb")
            .HasConversion(
                value => JsonSerializer.Serialize(value, (JsonSerializerOptions?)null),
                value => DeserializeTiers(value),
                new ValueComparer<List<CancellationPolicyTier>>(
                    (left, right) => JsonSerializer.Serialize(left) == JsonSerializer.Serialize(right),
                    value => JsonSerializer.Serialize(value).GetHashCode(),
                    value => JsonSerializer.Deserialize<List<CancellationPolicyTier>>(JsonSerializer.Serialize(value)) ?? new List<CancellationPolicyTier>()));

        // Translations as JSONB with explicit conversion
        builder.Property(p => p.Translations)
            .HasColumnType("jsonb")
            .HasConversion(
                value => JsonSerializer.Serialize(value, (JsonSerializerOptions?)null),
                value => JsonSerializer.Deserialize<Dictionary<string, Domain.Entities.Translations.CancellationPolicyTranslationData>>(value, (JsonSerializerOptions?)null) ?? new Dictionary<string, Domain.Entities.Translations.CancellationPolicyTranslationData>(),
                new ValueComparer<Dictionary<string, Domain.Entities.Translations.CancellationPolicyTranslationData>>(
                    (left, right) => JsonSerializer.Serialize(left) == JsonSerializer.Serialize(right),
                    value => JsonSerializer.Serialize(value).GetHashCode(),
                    value => JsonSerializer.Deserialize<Dictionary<string, Domain.Entities.Translations.CancellationPolicyTranslationData>>(JsonSerializer.Serialize(value)) ?? new Dictionary<string, Domain.Entities.Translations.CancellationPolicyTranslationData>()));

        // Indexes
        builder.HasIndex(p => new { p.TourScope, p.Status, p.IsDeleted });
        builder.HasIndex(p => new { p.Status, p.IsDeleted });
        builder.HasIndex(p => p.CreatedOnUtc);
    }

    private static List<CancellationPolicyTier> DeserializeTiers(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value == "[]" || value == "{}")
            return new List<CancellationPolicyTier>();

        try
        {
            return JsonSerializer.Deserialize<List<CancellationPolicyTier>>(value, (JsonSerializerOptions?)null)
                ?? new List<CancellationPolicyTier>();
        }
        catch (JsonException)
        {
            return new List<CancellationPolicyTier>();
        }
    }
}
