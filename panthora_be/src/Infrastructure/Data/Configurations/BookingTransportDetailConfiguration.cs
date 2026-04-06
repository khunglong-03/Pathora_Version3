using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BookingTransportDetailConfiguration : IEntityTypeConfiguration<BookingTransportDetailEntity>
{
    public void Configure(EntityTypeBuilder<BookingTransportDetailEntity> builder)
    {
        builder.ToTable("BookingTransportDetails");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.TransportType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.TicketNumber)
            .HasMaxLength(100);

        builder.Property(x => x.ETicketNumber)
            .HasMaxLength(100);

        builder.Property(x => x.SeatNumber)
            .HasMaxLength(30);

        builder.Property(x => x.SeatCapacity)
            .HasDefaultValue(0);

        builder.Property(x => x.SeatClass)
            .HasMaxLength(50);

        builder.Property(x => x.VehicleNumber)
            .HasMaxLength(100);

        builder.Property(x => x.BuyPrice)
            .HasColumnType("numeric(18,2)")
            .HasDefaultValue(0);

        builder.Property(x => x.TaxRate)
            .HasColumnType("numeric(5,2)")
            .HasDefaultValue(0);

        builder.Property(x => x.TotalBuyPrice)
            .HasColumnType("numeric(18,2)")
            .HasDefaultValue(0);

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
            .WithMany(x => x.TransportDetails)
            .HasForeignKey(x => x.BookingActivityReservationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Supplier)
            .WithMany()
            .HasForeignKey(x => x.SupplierId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
