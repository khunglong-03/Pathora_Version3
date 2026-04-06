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

        builder.HasIndex(x => new { x.SupplierId, x.RoomType });
        builder.HasIndex(x => x.SupplierId);

        builder.HasOne(x => x.Supplier)
            .WithMany()
            .HasForeignKey(x => x.SupplierId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
