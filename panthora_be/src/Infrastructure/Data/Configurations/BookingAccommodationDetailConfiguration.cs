using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BookingAccommodationDetailConfiguration : IEntityTypeConfiguration<BookingAccommodationDetailEntity>
{
    public void Configure(EntityTypeBuilder<BookingAccommodationDetailEntity> builder)
    {
        builder.ToTable("BookingAccommodationDetails");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.AccommodationName)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(x => x.RoomType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.RoomCount)
            .HasDefaultValue(1);

        builder.Property(x => x.BedType)
            .HasMaxLength(100);

        builder.Property(x => x.Address)
            .HasMaxLength(500);

        builder.Property(x => x.ContactPhone)
            .HasMaxLength(50);

        builder.Property(x => x.BuyPrice)
            .HasColumnType("numeric(18,2)")
            .HasDefaultValue(0);

        builder.Property(x => x.TaxRate)
            .HasColumnType("numeric(5,2)")
            .HasDefaultValue(0);

        builder.Property(x => x.TotalBuyPrice)
            .HasColumnType("numeric(18,2)")
            .HasDefaultValue(0);

        builder.Property(x => x.ConfirmationCode)
            .HasMaxLength(200);

        builder.Property(x => x.FileUrl)
            .HasMaxLength(1000);

        builder.Property(x => x.SpecialRequest)
            .HasMaxLength(1000);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Note)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.BookingActivityReservationId);
        builder.HasIndex(x => x.SupplierId);
        builder.HasIndex(x => x.Status);

        builder.HasOne(x => x.BookingActivityReservation)
            .WithMany(x => x.AccommodationDetails)
            .HasForeignKey(x => x.BookingActivityReservationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Supplier)
            .WithMany()
            .HasForeignKey(x => x.SupplierId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
