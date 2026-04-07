namespace Infrastructure.Data.Configurations;

using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class HotelRoomInventoryEntityConfiguration : IEntityTypeConfiguration<HotelRoomInventoryEntity>
{
    public void Configure(EntityTypeBuilder<HotelRoomInventoryEntity> builder)
    {
        builder.ToTable("HotelRoomInventory");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.RoomType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.TotalRooms)
            .IsRequired();

        builder.Property(x => x.Name)
            .HasMaxLength(200);

        builder.Property(x => x.Address)
            .HasMaxLength(500);

        builder.Property(x => x.LocationArea)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(x => x.OperatingCountries)
            .HasMaxLength(500);

        builder.Property(x => x.ImageUrls)
            .HasColumnType("jsonb");

        builder.Property(x => x.Notes)
            .HasMaxLength(1000);

        builder.HasIndex(x => new { x.SupplierId, x.RoomType });
        builder.HasIndex(x => x.SupplierId);
        builder.HasIndex(x => x.LocationArea);
        builder.HasIndex(x => x.OperatingCountries);

        builder.HasOne(x => x.Supplier)
            .WithMany()
            .HasForeignKey(x => x.SupplierId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
