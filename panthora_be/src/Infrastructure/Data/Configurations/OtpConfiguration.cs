using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class OtpConfiguration : IEntityTypeConfiguration<OtpEntity>
{
    public void Configure(EntityTypeBuilder<OtpEntity> builder)
    {
        builder.ToTable("Otps");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Id)
            .ValueGeneratedNever();

        builder.Property(o => o.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(o => o.Code)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(o => o.ExpiryDate)
            .IsRequired();

        builder.Property(o => o.IsDeleted)
            .HasDefaultValue(false);

        builder.HasIndex(o => o.Email)
            .IsUnique();

        builder.HasIndex(o => o.ExpiryDate);
    }
}
