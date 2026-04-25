using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class VehicleEntityConfiguration : IEntityTypeConfiguration<VehicleEntity>
{
    public void Configure(EntityTypeBuilder<VehicleEntity> builder)
    {
        builder.ToTable("Vehicles");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.VehicleType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(x => x.Brand)
            .HasMaxLength(100);

        builder.Property(x => x.Model)
            .HasMaxLength(100);

        builder.Property(x => x.SeatCapacity)
            .HasDefaultValue(1);

        builder.Property(x => x.LocationArea)
            .HasConversion<string>()
            .HasMaxLength(20);

        // CountryCode renamed to OperatingCountries on 2026-04-07
        builder.Property(x => x.OperatingCountries)
            .HasMaxLength(500);

        builder.Property(x => x.VehicleImageUrls)
            .HasColumnType("jsonb");

        builder.Property(x => x.Notes)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.OwnerId);
        builder.HasIndex(x => x.IsDeleted);
        builder.HasIndex(x => x.LocationArea);
        builder.HasIndex(x => x.OperatingCountries);
        builder.HasIndex(x => x.SupplierId);

        builder.HasOne(x => x.Owner)
            .WithMany()
            .HasForeignKey(x => x.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Supplier)
            .WithMany()
            .HasForeignKey(x => x.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global query filter to exclude inactive vehicles or those owned by banned users
        builder.HasQueryFilter(x => !x.IsDeleted && x.IsActive && x.Owner.Status == Domain.Enums.UserStatus.Active);
    }
}
