using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BookingActivityReservationConfiguration : IEntityTypeConfiguration<BookingActivityReservationEntity>
{
    public void Configure(EntityTypeBuilder<BookingActivityReservationEntity> builder)
    {
        builder.ToTable("BookingActivityReservations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Order)
            .IsRequired();

        builder.Property(x => x.ActivityType)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Title)
            .HasMaxLength(300)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(1000);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.TotalServicePrice)
            .HasColumnType("numeric(18,2)")
            .HasDefaultValue(0);

        builder.Property(x => x.TotalServicePriceAfterTax)
            .HasColumnType("numeric(18,2)")
            .HasDefaultValue(0);

        builder.Property(x => x.Note)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.BookingId);
        builder.HasIndex(x => x.SupplierId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => new { x.BookingId, x.Order });

        builder.HasOne(x => x.Booking)
            .WithMany(x => x.BookingActivityReservations)
            .HasForeignKey(x => x.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Supplier)
            .WithMany()
            .HasForeignKey(x => x.SupplierId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
