using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class UserSettingEntityConfiguration : IEntityTypeConfiguration<UserSettingEntity>
{
    public void Configure(EntityTypeBuilder<UserSettingEntity> builder)
    {
        builder.ToTable("UserSettings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.PreferredLanguage)
            .HasMaxLength(10)
            .IsRequired()
            .HasDefaultValue("vi");

        builder.Property(s => s.NotificationEmail)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(s => s.NotificationSms)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(s => s.NotificationPush)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(s => s.Theme)
            .HasMaxLength(20)
            .IsRequired()
            .HasDefaultValue("light");

        // One-to-one relationship with User
        builder.HasOne(s => s.User)
            .WithOne(u => u.UserSetting)
            .HasForeignKey<UserSettingEntity>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique index on UserId to enforce one-to-one
        builder.HasIndex(s => s.UserId)
            .IsUnique();
    }
}
