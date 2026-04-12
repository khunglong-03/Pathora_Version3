using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<UserEntity>
{
    public void Configure(EntityTypeBuilder<UserEntity> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Username)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.FullName)
            .HasMaxLength(200);

        builder.Property(u => u.PhoneNumber)
            .HasMaxLength(20);

        builder.Property(u => u.Address)
            .HasMaxLength(500);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.AvatarUrl)
            .HasMaxLength(500);

        builder.Property(u => u.Status)
            .IsRequired();

        builder.Property(u => u.Password)
            .IsRequired(false);

        builder.Property(u => u.GoogleId)
            .HasMaxLength(255)
            .IsRequired(false);

        builder.Property(u => u.Balance)
            .HasPrecision(18, 2)
            .HasDefaultValue(0m);

        builder.Property(u => u.BankAccountNumber)
            .HasMaxLength(50);

        builder.Property(u => u.BankCode)
            .HasMaxLength(20);

        builder.Property(u => u.BankAccountName)
            .HasMaxLength(200);

        builder.Property(u => u.BankAccountVerified)
            .HasDefaultValue(false);

        builder.Property(u => u.BankAccountVerifiedAt);

        builder.Property(u => u.BankAccountVerifiedBy);

        builder.HasIndex(u => u.GoogleId)
            .IsUnique()
            .HasFilter("\"GoogleId\" IS NOT NULL");

        builder.Property(u => u.ForcePasswordChange)
            .HasDefaultValue(false);

        // Note: VerifyStatus int→string conversion may need a data migration if existing
        // rows have non-zero VerifyStatus values. Verify with:
        // SELECT DISTINCT "VerifyStatus" FROM "Users" WHERE "VerifyStatus" IS NOT NULL
        builder.Property(u => u.VerifyStatus)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(u => u.IsDeleted)
            .HasDefaultValue(false);

        builder.HasIndex(u => u.IsDeleted);

        builder.HasIndex(u => u.Username)
            .IsUnique();

        builder.HasIndex(u => u.CreatedOnUtc);

        builder.HasMany<UserRoleEntity>()
            .WithOne()
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // UserSetting relationship (forward-side; reverse-side + cascade in UserSettingEntityConfiguration)
        builder.HasOne(u => u.UserSetting)
            .WithOne(s => s.User)
            .HasForeignKey<UserSettingEntity>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
