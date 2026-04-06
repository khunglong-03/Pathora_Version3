using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class FileMetadataConfiguration : IEntityTypeConfiguration<FileMetadataEntity>
{
    public void Configure(EntityTypeBuilder<FileMetadataEntity> builder)
    {
        builder.ToTable("FileMetadatas");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.OriginalFileName)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(f => f.StoredFileName)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(f => f.MimeType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(f => f.Url)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(f => f.FileSize)
            .IsRequired();

        builder.Property(f => f.IsDeleted)
            .HasDefaultValue(false);

        builder.HasIndex(f => f.LinkedEntityId);

        builder.HasIndex(f => f.IsDeleted);
    }
}
