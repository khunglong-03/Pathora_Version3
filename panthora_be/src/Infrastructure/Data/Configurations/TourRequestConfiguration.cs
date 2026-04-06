using System.Text.Json;

using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourRequestConfiguration : IEntityTypeConfiguration<TourRequestEntity>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public void Configure(EntityTypeBuilder<TourRequestEntity> builder)
    {
        builder.ToTable("TourRequests");

        builder.HasKey(t => t.Id);

        // Customer info
        builder.Property(t => t.CustomerName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.CustomerPhone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(t => t.CustomerEmail)
            .HasMaxLength(200);

        // Request details
        builder.Property(t => t.Destination)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(t => t.DepartureDate).IsRequired();

        builder.Property(t => t.NumberAdult).IsRequired();
        builder.Property(t => t.NumberChild).HasDefaultValue(0);
        builder.Property(t => t.NumberInfant).HasDefaultValue(0);

        builder.Property(t => t.Budget)
            .HasColumnType("numeric(18,2)");

        builder.Property(t => t.TravelInterests)
            .HasColumnType("jsonb")
            .HasConversion(
                value => SerializeTravelInterests(value),
                value => DeserializeTravelInterests(value));
        builder.Property(t => t.TravelInterests)
            .Metadata.SetValueComparer(
                new ValueComparer<List<string>>(
                    (left, right) => SerializeTravelInterests(left) == SerializeTravelInterests(right),
                    value => SerializeTravelInterests(value).GetHashCode(StringComparison.Ordinal),
                    value => DeserializeTravelInterests(SerializeTravelInterests(value))));

        builder.Property(t => t.PreferredAccommodation)
            .HasMaxLength(500);

        builder.Property(t => t.TransportationPreference)
            .HasMaxLength(500);

        builder.Property(t => t.SpecialRequirements)
            .HasMaxLength(2000);

        builder.Property(t => t.Note)
            .HasMaxLength(2000);

        // Status & review
        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.AdminNote)
            .HasMaxLength(2000);

        // Indexes
        builder.HasIndex(t => t.Status);
        builder.HasIndex(t => t.UserId);
        builder.HasIndex(t => t.DepartureDate);
        // Composite indexes for common query patterns
        builder.HasIndex(t => new { t.Status, t.DepartureDate });

        // Relationships
        builder.HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Reviewer)
            .WithMany()
            .HasForeignKey(t => t.ReviewedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.TourInstance)
            .WithMany()
            .HasForeignKey(t => t.TourInstanceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.Bookings)
            .WithOne(b => b.TourRequest)
            .HasForeignKey(b => b.TourRequestId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    private static string SerializeTravelInterests(List<string>? value)
    {
        return JsonSerializer.Serialize(value ?? [], JsonOptions);
    }

    private static List<string> DeserializeTravelInterests(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        return JsonSerializer.Deserialize<List<string>>(json, JsonOptions) ?? [];
    }
}
