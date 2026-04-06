using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class CustomerPaymentConfiguration : IEntityTypeConfiguration<CustomerPaymentEntity>
{
    public void Configure(EntityTypeBuilder<CustomerPaymentEntity> builder)
    {
        builder.ToTable("CustomerPayments");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Amount)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(p => p.PaymentMethod)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(p => p.TransactionRef)
            .HasMaxLength(200);

        builder.Property(p => p.PaidAt).IsRequired();

        builder.Property(p => p.Note)
            .HasMaxLength(1000);

        // Indexes
        builder.HasIndex(p => p.BookingId);
        builder.HasIndex(p => p.CustomerDepositId);
        builder.HasIndex(p => p.PaidAt);
        builder.HasIndex(p => p.TransactionRef);
    }
}
