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

        // DEPRECATED: TransportApprovalStatus and TransportApprovalNote columns still exist in DB
        // but properties have been removed from TourInstanceEntity.
        // These columns will be dropped in the AddTransportPlanToActivity migration.
        // DO NOT re-add EF mapping for removed properties.

        builder.Property(t => t.CancellationReason)
            .HasMaxLength(1000);

        builder.Property(t => t.StartDate).IsRequired();
        builder.Property(t => t.EndDate).IsRequired();
        builder.Property(t => t.DurationDays).IsRequired();
        builder.Property(t => t.MaxParticipation).IsRequired();
        builder.Property(t => t.CurrentParticipation).HasDefaultValue(0);
        builder.Property(t => t.BasePrice)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(t => t.IsDeleted)
            .HasDefaultValue(false);
        builder.Property(t => t.RowVersion)
            .IsRowVersion()
            .IsRequired()
            .HasDefaultValue(Array.Empty<byte>());
        builder.Property(t => t.IncludedServices)
            .ConfigureCollectionJsonb();
        builder.Property(t => t.Translations)
            .ConfigureTranslationsJsonb();
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
            builder.HasIndex(t => t.TourId);
            builder.HasIndex(t => t.ClassificationId);
            builder.HasIndex(t => t.InstanceType);
            builder.HasIndex(t => t.Status);
            builder.HasIndex(t => t.StartDate);
            builder.HasIndex(t => t.EndDate);
            builder.HasIndex(t => t.CurrentParticipation);
            builder.HasIndex(t => t.BasePrice);
            builder.HasIndex(t => t.TourCode);
            builder.HasIndex(t => t.Title);
            builder.HasIndex(t => t.Location);
            builder.HasIndex(t => t.TourName);
            builder.HasIndex(t => t.ClassificationName);
            builder.HasIndex(t => t.DurationDays);
            builder.HasIndex(t => t.ConfirmationDeadline);
            builder.HasIndex(t => t.MaxParticipation);
            builder.HasIndex(t => t.IncludedServices);
            builder.HasIndex(t => t.Translations);
            builder.HasIndex(t => t.IsDeleted);
            builder.HasIndex(t => t.RowVersion);
        builder.HasOne(t => t.Tour)
            .WithMany()
            .HasForeignKey(t => t.TourId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Classification)
            .WithMany()
            .HasForeignKey(t => t.ClassificationId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Navigation(t => t.Managers);
    }
}
