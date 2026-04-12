using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PaymentTransactionConfiguration : IEntityTypeConfiguration<PaymentTransactionEntity>
{
    public void Configure(EntityTypeBuilder<PaymentTransactionEntity> builder)
    {
        builder.ToTable("PaymentTransactions");

        // Primary key
        builder.HasKey(x => x.Id);

        // Transaction identification
        builder.Property(x => x.TransactionCode)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(x => x.TransactionCode)
            .IsUnique();

        builder.Property(x => x.ExternalTransactionId)
            .HasMaxLength(255);

        // Unique index on ExternalTransactionId for webhook deduplication (Phase 3.2)
        builder.HasIndex(x => x.ExternalTransactionId)
            .IsUnique()
            .HasFilter("\"ExternalTransactionId\" IS NOT NULL");

        builder.Property(x => x.PayOSOrderCode)
            .HasMaxLength(50);

        builder.HasIndex(x => x.PayOSOrderCode);

        // Transaction type & status
        builder.Property(x => x.Type)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<int>();

        // Amount
        builder.Property(x => x.Amount)
            .HasPrecision(18, 2);

        builder.Property(x => x.PaidAmount)
            .HasPrecision(18, 2);

        builder.Property(x => x.RemainingAmount)
            .HasPrecision(18, 2);

        // Payment method
        builder.Property(x => x.PaymentMethod)
            .IsRequired()
            .HasConversion<int>();

        // Timing
        builder.Property(x => x.ExpiredAt);
        builder.Property(x => x.PaidAt);
        builder.Property(x => x.CompletedAt);

        // Checkout info
        builder.Property(x => x.CheckoutUrl)
            .HasMaxLength(500);

        builder.Property(x => x.PaymentNote)
            .HasMaxLength(500);

        builder.Property(x => x.ReferenceCode)
            .HasMaxLength(12);

        // Unique index on ReferenceCode for idempotent payment matching
        builder.HasIndex(x => x.ReferenceCode)
            .IsUnique()
            .HasFilter("\"ReferenceCode\" IS NOT NULL");

        // Bank info
        builder.Property(x => x.SenderName)
            .HasMaxLength(255);

        builder.Property(x => x.SenderAccountNumber)
            .HasMaxLength(50);

        builder.Property(x => x.BeneficiaryBank)
            .HasMaxLength(255);

        // Manager bank account (audit fields for manager-direct-payment)
        builder.Property(x => x.ManagerAccountNumber)
            .HasMaxLength(50);

        builder.Property(x => x.ManagerBankCode)
            .HasMaxLength(20);

        builder.Property(x => x.ManagerAccountName)
            .HasMaxLength(200);

        // Error tracking
        builder.Property(x => x.ErrorCode)
            .HasMaxLength(50);

        builder.Property(x => x.ErrorMessage)
            .HasMaxLength(500);

        builder.Property(x => x.LastProcessingError)
            .HasMaxLength(500);

        builder.Property(x => x.LastProcessedAt);

        // Metadata
        builder.Property(x => x.RetryCount)
            .HasDefaultValue(0);

        // Audit
        builder.Property(x => x.CreatedBy)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(x => x.LastModifiedBy)
            .HasMaxLength(255);

        // Foreign key to Booking
        builder.HasOne(x => x.Booking)
            .WithMany(x => x.PaymentTransactions)
            .HasForeignKey(x => x.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes for common query patterns
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.BookingId);
        builder.HasIndex(x => x.PaidAt);
        builder.HasIndex(x => new { x.Status, x.PaidAt });
    }
}
