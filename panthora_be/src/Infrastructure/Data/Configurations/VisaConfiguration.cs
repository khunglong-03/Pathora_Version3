using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class VisaConfiguration : IEntityTypeConfiguration<VisaEntity>
{
    public void Configure(EntityTypeBuilder<VisaEntity> builder)
    {
        builder.ToTable("Visas");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.VisaNumber)
            .HasMaxLength(100);

        builder.Property(x => x.Country)
            .HasMaxLength(100);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.EntryType)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(x => x.FileUrl)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.VisaApplicationId).IsUnique();
        builder.HasIndex(x => x.Status);

        builder.HasOne(x => x.VisaApplication)
            .WithOne(x => x.Visa)
            .HasForeignKey<VisaEntity>(x => x.VisaApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
