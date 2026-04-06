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

        builder.Property(x => x.VehiclePlate)
            .HasMaxLength(20)
            .IsRequired();

        builder.HasIndex(x => x.VehiclePlate)
            .IsUnique()
            .HasFilter(null);

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

        builder.Property(x => x.CountryCode)
            .HasMaxLength(2);

        builder.Property(x => x.VehicleImageUrls)
            .HasColumnType("jsonb");

        builder.Property(x => x.Notes)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.OwnerId);
        builder.HasIndex(x => x.IsDeleted);
        builder.HasIndex(x => x.LocationArea);

        builder.HasOne(x => x.Owner)
            .WithMany()
            .HasForeignKey(x => x.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
