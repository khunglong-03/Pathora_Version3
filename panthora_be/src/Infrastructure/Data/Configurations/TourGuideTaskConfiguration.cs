using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourGuideTaskConfiguration : IEntityTypeConfiguration<TourGuideTaskEntity>
{
    public void Configure(EntityTypeBuilder<TourGuideTaskEntity> builder)
    {
        builder.ToTable("TourGuideTasks");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(t => t.Description)
            .HasMaxLength(1000);

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.AssignedGuideId)
            .HasMaxLength(200);

        builder.Property(t => t.CompletedBy)
            .HasMaxLength(200);

        builder.Property(t => t.Notes)
            .HasMaxLength(1000);

        builder.Property(t => t.EvidenceImageUrls)
            .ConfigureCollectionJsonb();

        builder.HasOne(t => t.TourInstance)
            .WithMany()
            .HasForeignKey(t => t.TourInstanceId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(t => t.TourInstanceId);
        builder.HasIndex(t => t.AssignedGuideId);
        builder.HasIndex(t => t.Status);
    }
}
