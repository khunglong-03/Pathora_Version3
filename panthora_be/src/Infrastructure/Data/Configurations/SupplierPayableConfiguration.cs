using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class SupplierPayableConfiguration : IEntityTypeConfiguration<SupplierPayableEntity>
{
    public void Configure(EntityTypeBuilder<SupplierPayableEntity> builder)
    {
        builder.ToTable("SupplierPayables");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ExpectedAmount)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(x => x.PaidAmount)
            .HasColumnType("numeric(18,2)")
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Note)
            .HasMaxLength(1000);

        builder.Property(x => x.DueAt);

        builder.HasIndex(x => x.BookingId);
        builder.HasIndex(x => x.SupplierId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.DueAt);

        builder.HasOne(x => x.Booking)
            .WithMany(x => x.SupplierPayables)
            .HasForeignKey(x => x.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Supplier)
            .WithMany()
            .HasForeignKey(x => x.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Receipts)
            .WithOne(x => x.SupplierPayable)
            .HasForeignKey(x => x.SupplierPayableId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
