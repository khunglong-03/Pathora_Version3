using Domain.Constant;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class SystemKeyConfiguration : IEntityTypeConfiguration<SystemKey>
{
    public void Configure(EntityTypeBuilder<SystemKey> builder)
    {
        builder.ToTable("SystemKeys");

        builder.HasKey(sk => sk.Id);

        builder.Property(sk => sk.ParentId)
            .HasDefaultValue(0);

        builder.Property(sk => sk.CodeKey)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(sk => sk.CodeValue)
            .IsRequired();

        builder.Property(sk => sk.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(sk => sk.SortOrder)
            .HasDefaultValue(0);

        builder.Property(sk => sk.IsDeleted)
            .HasDefaultValue(false);

        builder.HasIndex(sk => sk.CodeKey);

        builder.HasIndex(sk => new { sk.ParentId, sk.IsDeleted });
    }
}
