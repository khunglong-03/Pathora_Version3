using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class CustomerDepositConfiguration : IEntityTypeConfiguration<CustomerDepositEntity>
{
    public void Configure(EntityTypeBuilder<CustomerDepositEntity> builder)
    {
        builder.ToTable("CustomerDeposits");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.DepositOrder).IsRequired();

        builder.Property(d => d.ExpectedAmount)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(d => d.DueAt).IsRequired();

        builder.Property(d => d.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(d => d.Note)
            .HasMaxLength(1000);

        // Indexes
        builder.HasIndex(d => d.BookingId);
        builder.HasIndex(d => d.Status);
        builder.HasIndex(d => d.DueAt);

        // Unique: one booking can't have duplicate deposit orders
        builder.HasIndex(d => new { d.BookingId, d.DepositOrder })
            .IsUnique();

        builder.HasMany(d => d.Payments)
            .WithOne(p => p.CustomerDeposit)
            .HasForeignKey(p => p.CustomerDepositId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
