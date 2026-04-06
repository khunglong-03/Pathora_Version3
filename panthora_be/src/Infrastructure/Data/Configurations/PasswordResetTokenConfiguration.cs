using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetTokenEntity>
{
    public void Configure(EntityTypeBuilder<PasswordResetTokenEntity> builder)
    {
        builder.ToTable("PasswordResetTokens");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id)
            .ValueGeneratedNever();

        builder.Property(t => t.UserId)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(t => t.TokenHash)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(t => t.ExpiresAt)
            .IsRequired();

        builder.Property(t => t.IsDeleted)
            .HasDefaultValue(false);

        builder.HasIndex(t => t.UserId);
        builder.HasIndex(t => t.TokenHash);
        builder.HasIndex(t => t.ExpiresAt);
    }
}
