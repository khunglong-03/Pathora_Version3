using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class SupplierConfiguration : IEntityTypeConfiguration<SupplierEntity>
{
    public void Configure(EntityTypeBuilder<SupplierEntity> builder)
    {
        builder.ToTable("Suppliers");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.SupplierCode)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(s => s.SupplierType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(s => s.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.TaxCode)
            .HasMaxLength(30);

        builder.Property(s => s.Phone)
            .HasMaxLength(20);

        builder.Property(s => s.Email)
            .HasMaxLength(200);

        builder.Property(s => s.Address)
            .HasMaxLength(500);

        builder.Property(s => s.Note)
            .HasMaxLength(1000);

        builder.Property(s => s.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(s => s.IsDeleted)
            .HasDefaultValue(false)
            .IsRequired();

        builder.HasIndex(s => s.SupplierCode).IsUnique();
        builder.HasIndex(s => s.SupplierType);
        builder.HasIndex(s => s.IsActive);
        builder.HasIndex(s => s.IsDeleted);
    }
}
