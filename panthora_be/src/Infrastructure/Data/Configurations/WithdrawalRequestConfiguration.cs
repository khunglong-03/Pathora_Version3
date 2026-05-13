using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public sealed class WithdrawalRequestConfiguration : IEntityTypeConfiguration<WithdrawalRequestEntity>
{
    public void Configure(EntityTypeBuilder<WithdrawalRequestEntity> builder)
    {
        builder.ToTable("WithdrawalRequests");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Amount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(x => x.BankAccountNumber).IsRequired().HasMaxLength(50);
        builder.Property(x => x.BankCode).IsRequired().HasMaxLength(20);
        builder.Property(x => x.BankBin).IsRequired().HasMaxLength(20);
        builder.Property(x => x.BankShortName).HasMaxLength(100);
        builder.Property(x => x.BankAccountName).HasMaxLength(255);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.BankAccount)
            .WithMany()
            .HasForeignKey(x => x.BankAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.UserId, x.Status });
        builder.HasIndex(x => new { x.Status, x.CreatedOnUtc }).IsDescending(false, true);
    }
}
