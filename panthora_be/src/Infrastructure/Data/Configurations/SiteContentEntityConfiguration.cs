using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class SiteContentEntityConfiguration : IEntityTypeConfiguration<SiteContentEntity>
{
    public void Configure(EntityTypeBuilder<SiteContentEntity> builder)
    {
        builder.ToTable("site_contents");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.PageKey)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.ContentKey)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.ContentValue)
            .IsRequired();

        // Audit columns
        builder.Property(c => c.CreatedOnUtc);
        builder.Property(c => c.LastModifiedOnUtc);
        builder.Property(c => c.CreatedBy).HasMaxLength(256);

        // Unique composite index on PageKey + ContentKey
        builder.HasIndex(c => new { c.PageKey, c.ContentKey })
            .IsUnique();
    }
}