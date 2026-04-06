using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourDayActivityResourceLinkConfiguration : IEntityTypeConfiguration<TourDayActivityResourceLinkEntity>
{
    public void Configure(EntityTypeBuilder<TourDayActivityResourceLinkEntity> builder)
    {
        builder.ToTable("TourDayActivityResourceLinks");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.TourDayActivityId)
            .IsRequired();

        builder.Property(r => r.Url)
            .IsRequired()
            .HasMaxLength(2048);

        builder.Property(r => r.Order)
            .IsRequired();

        builder.HasIndex(r => r.TourDayActivityId);

        builder.HasOne(r => r.TourDayActivity)
            .WithMany(a => a.ResourceLinks)
            .HasForeignKey(r => r.TourDayActivityId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
