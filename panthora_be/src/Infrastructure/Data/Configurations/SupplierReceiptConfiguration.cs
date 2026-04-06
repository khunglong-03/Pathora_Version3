using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class SupplierReceiptConfiguration : IEntityTypeConfiguration<SupplierReceiptEntity>
{
    public void Configure(EntityTypeBuilder<SupplierReceiptEntity> builder)
    {
        builder.ToTable("SupplierReceipts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Amount)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(x => x.PaymentMethod)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.TransactionRef)
            .HasMaxLength(200);

        builder.Property(x => x.Note)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.SupplierPayableId);
        builder.HasIndex(x => x.PaidAt);

        builder.HasOne(x => x.SupplierPayable)
            .WithMany(x => x.Receipts)
            .HasForeignKey(x => x.SupplierPayableId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
