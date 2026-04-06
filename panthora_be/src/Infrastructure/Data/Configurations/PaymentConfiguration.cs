using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<PaymentEntity>
{
    public void Configure(EntityTypeBuilder<PaymentEntity> builder)
    {
        builder.ToTable("Payments");

        builder.HasKey(p => p.Id);

        // Audit columns
        builder.Property(p => p.CreatedOnUtc);
        builder.Property(p => p.LastModifiedOnUtc);
        builder.Property(p => p.CreatedBy).HasMaxLength(256);

        // Amount & currency
        builder.Property(p => p.Amount)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(p => p.Currency)
            .HasMaxLength(10)
            .IsRequired();

        // Tax & billing
        builder.Property(p => p.TaxAmount)
            .HasColumnType("numeric(18,2)");

        builder.Property(p => p.TaxRate)
            .HasColumnType("double precision");

        builder.Property(p => p.TaxCode)
            .HasMaxLength(50);

        builder.Property(p => p.BillingAddress)
            .HasMaxLength(500);

        // Party info
        builder.Property(p => p.SenderName)
            .HasMaxLength(200);

        builder.Property(p => p.SenderAccountNumber)
            .HasMaxLength(50);

        builder.Property(p => p.ReceiverName)
            .HasMaxLength(200);

        builder.Property(p => p.ReceiverAccountNumber)
            .HasMaxLength(50);

        builder.Property(p => p.BeneficiaryBank)
            .HasMaxLength(200);

        builder.Property(p => p.PaymentDescription)
            .HasMaxLength(1000);

        // Transaction timestamp
        builder.Property(p => p.TransactionTimestamp)
            .IsRequired();

        // Indexes
        builder.HasIndex("PaidUser");
        builder.HasIndex(p => p.BookingId);
        builder.HasIndex(p => p.TransactionTimestamp);

        // Relationships
        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey("PaidUser")
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<BookingEntity>()
            .WithMany()
            .HasForeignKey(p => p.BookingId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
