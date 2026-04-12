using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public sealed class ManagerBankAccountConfiguration : IEntityTypeConfiguration<ManagerBankAccountEntity>
{
    public void Configure(EntityTypeBuilder<ManagerBankAccountEntity> builder)
    {
        builder.ToTable("ManagerBankAccounts");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.BankAccountNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.BankCode)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(e => e.BankBin)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(e => e.BankShortName)
            .HasMaxLength(100);

        builder.Property(e => e.BankAccountName)
            .HasMaxLength(200);

        builder.Property(e => e.IsDefault)
            .HasDefaultValue(false);

        builder.Property(e => e.IsVerified)
            .HasDefaultValue(false);

        builder.Property(e => e.VerifiedAt);

        builder.Property(e => e.VerifiedBy);

        // FK → Users
        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.UserId);

        // Unique filtered index: at most one default per user
        builder.HasIndex(e => new { e.UserId, e.IsDefault })
            .HasFilter("\"IsDefault\" = true")
            .IsUnique();
    }
}
