using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourInstanceConfiguration : IEntityTypeConfiguration<TourInstanceEntity>
{
    public void Configure(EntityTypeBuilder<TourInstanceEntity> builder)
    {
        builder.ToTable("TourInstances");

        builder.HasKey(t => t.Id);

        // Instance identity
        builder.Property(t => t.TourInstanceCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(500);

        // Denormalized from Tour
        builder.Property(t => t.TourName)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(t => t.TourCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(t => t.ClassificationName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Location)
            .HasMaxLength(500);

        // Status & Type
        builder.Property(t => t.InstanceType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

#pragma warning disable CS0618
        builder.Property(t => t.TransportApprovalStatus)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(t => t.TransportApprovalNote)
            .HasMaxLength(1000);
#pragma warning restore CS0618

        builder.Property(t => t.CancellationReason)
            .HasMaxLength(1000);

        // Schedule
        builder.Property(t => t.StartDate).IsRequired();
        builder.Property(t => t.EndDate).IsRequired();
        builder.Property(t => t.DurationDays).IsRequired();

        // Participants
        builder.Property(t => t.MaxParticipation).IsRequired();
        builder.Property(t => t.CurrentParticipation).HasDefaultValue(0);

        // BasePrice
        builder.Property(t => t.BasePrice)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        // Soft delete
        builder.Property(t => t.IsDeleted)
            .HasDefaultValue(false);

        // IncludedServices as JSONB column with value comparer for change tracking
        builder.Property(t => t.IncludedServices)
            .ConfigureCollectionJsonb();

        // Translations as JSONB column
        builder.Property(t => t.Translations)
            .ConfigureTranslationsJsonb();

        // Thumbnail as owned inline
        builder.OwnsOne(t => t.Thumbnail, thumb =>
        {
            thumb.Property(i => i.FileId).HasColumnName("Thumbnail_FileId").HasMaxLength(200);
            thumb.Property(i => i.OriginalFileName).HasColumnName("Thumbnail_OriginalFileName").HasMaxLength(500);
            thumb.Property(i => i.FileName).HasColumnName("Thumbnail_FileName").HasMaxLength(500);
            thumb.Property(i => i.PublicURL).HasColumnName("Thumbnail_PublicURL").HasMaxLength(1000);
        });

        // Images lưu trong bảng riêng TourInstanceImages
        builder.OwnsMany(t => t.Images, img =>
        {
            img.ToTable("TourInstanceImages");
            img.WithOwner().HasForeignKey("TourInstanceId");
            img.Property<int>("Id").ValueGeneratedOnAdd().UseIdentityAlwaysColumn();
            img.HasKey("Id");
            img.Property(i => i.FileId).HasMaxLength(200);
            img.Property(i => i.OriginalFileName).HasMaxLength(500);
            img.Property(i => i.FileName).HasMaxLength(500);
            img.Property(i => i.PublicURL).HasMaxLength(1000);
        });

        // Indexes
        builder.HasIndex(t => t.TourInstanceCode).IsUnique();
        builder.HasIndex(t => new { t.IsDeleted, t.InstanceType, t.Status, t.StartDate })
            .HasFilter("\"IsDeleted\" = false");
        builder.HasIndex(t => t.TourId);
        builder.HasIndex(t => t.BasePrice);
        builder.HasIndex(t => t.IsDeleted)
            .HasFilter("\"IsDeleted\" = false");
        // Note: GIN trigram index on LOWER(Location) is created via raw SQL in the migration
        // because EF Core fluent API cannot express GIN ops with gin_trgm_ops.

        // Relationships
        builder.HasOne(t => t.Tour)
            .WithMany()
            .HasForeignKey(t => t.TourId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Classification)
            .WithMany()
            .HasForeignKey(t => t.ClassificationId)
            .OnDelete(DeleteBehavior.Restrict);

        // NOTE: HotelProvider FK removed — hotel assignment is now per-accommodation activity

        builder.HasOne(t => t.TransportProvider)
            .WithMany()
            .HasForeignKey(t => t.TransportProviderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Managers (TourInstanceManagers) — configured via separate configuration class
        builder.Navigation(t => t.Managers);
    }
}
