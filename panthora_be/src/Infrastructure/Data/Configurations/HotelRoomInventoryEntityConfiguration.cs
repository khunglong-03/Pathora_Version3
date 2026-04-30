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

        // Thumbnail là owned entity, lưu inline trong bảng HotelRoomInventory
        builder.OwnsOne(t => t.Thumbnail, thumb =>
        {
            thumb.Property(i => i.FileId).HasColumnName("Thumbnail_FileId").HasMaxLength(200);
            thumb.Property(i => i.OriginalFileName).HasColumnName("Thumbnail_OriginalFileName").HasMaxLength(500);
            thumb.Property(i => i.FileName).HasColumnName("Thumbnail_FileName").HasMaxLength(500);
            thumb.Property(i => i.PublicURL).HasColumnName("Thumbnail_PublicURL").HasMaxLength(1000);
        });

        // Images lưu trong bảng riêng HotelRoomImages
        builder.OwnsMany(t => t.Images, img =>
        {
            img.ToTable("HotelRoomImages");
            img.WithOwner().HasForeignKey("HotelRoomInventoryId");
            img.Property<int>("Id").ValueGeneratedOnAdd().UseIdentityAlwaysColumn();
            img.HasKey("Id");
            img.Property(i => i.FileId).HasMaxLength(200);
            img.Property(i => i.OriginalFileName).HasMaxLength(500);
            img.Property(i => i.FileName).HasMaxLength(500);
            img.Property(i => i.PublicURL).HasMaxLength(1000);
        });

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
