using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourInstanceManagerConfiguration : IEntityTypeConfiguration<TourInstanceManagerEntity>
{
    public void Configure(EntityTypeBuilder<TourInstanceManagerEntity> builder)
    {
        builder.ToTable("TourInstanceManagers");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Role)
            .IsRequired()
            .HasConversion<string>();

        builder.HasIndex(m => m.TourInstanceId);
        builder.HasIndex(m => m.UserId);
        builder.HasIndex(m => new { m.TourInstanceId, m.UserId, m.Role }).IsUnique();

        builder.HasOne(m => m.TourInstance)
            .WithMany(t => t.Managers)
            .HasForeignKey(m => m.TourInstanceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.User)
            .WithMany()
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
