using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourResourceConfiguration : IEntityTypeConfiguration<TourResourceEntity>
{
    public void Configure(EntityTypeBuilder<TourResourceEntity> builder)
    {
        builder.ToTable("TourResources");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.TourId)
            .IsRequired();

        builder.Property(r => r.Type)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(r => r.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(r => r.Description)
            .HasMaxLength(1000);

        builder.Property(r => r.Address)
            .HasMaxLength(500);

        builder.Property(r => r.City)
            .HasMaxLength(100);

        builder.Property(r => r.Country)
            .HasMaxLength(100);

        builder.Property(r => r.ContactPhone)
            .HasMaxLength(50);

        builder.Property(r => r.ContactEmail)
            .HasMaxLength(200);

        builder.Property(r => r.EntranceFee)
            .HasColumnType("numeric(18,2)");

        builder.Property(r => r.Price)
            .HasColumnType("numeric(18,2)");

        builder.Property(r => r.PricingType)
            .HasMaxLength(50);

        builder.Property(r => r.TransportationType)
            .HasMaxLength(50);

        builder.Property(r => r.TransportationName)
            .HasMaxLength(100);

        builder.Property(r => r.TicketInfo)
            .HasMaxLength(500);

        builder.Property(r => r.CheckInTime)
            .HasMaxLength(50);

        builder.Property(r => r.CheckOutTime)
            .HasMaxLength(50);

        builder.Property(r => r.Note)
            .HasMaxLength(1000);

        builder.Property(r => r.Translations)
            .ConfigureTranslationsJsonb();

        builder.HasIndex(r => r.TourId);
        builder.HasIndex(r => r.Type);

        builder.HasOne(r => r.Tour)
            .WithMany(t => t.Resources)
            .HasForeignKey(r => r.TourId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.FromLocation)
            .WithMany()
            .HasForeignKey(r => r.FromLocationId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Property(r => r.FromLocationId).IsRequired(false);
        builder.HasIndex(r => r.FromLocationId);

        builder.HasOne(r => r.ToLocation)
            .WithMany()
            .HasForeignKey(r => r.ToLocationId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Property(r => r.ToLocationId).IsRequired(false);
        builder.HasIndex(r => r.ToLocationId);
    }
}
