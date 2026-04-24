using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourConfiguration : IEntityTypeConfiguration<TourEntity>
{
    public void Configure(EntityTypeBuilder<TourEntity> builder)
    {
        builder.ToTable("Tours");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TourCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(t => t.TourCode)
            .IsUnique();

        builder.Property(t => t.TourName)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(t => t.ShortDescription)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(t => t.LongDescription)
            .IsRequired();

        builder.Property(t => t.SEOTitle)
            .HasMaxLength(300);

        builder.Property(t => t.SEODescription)
            .HasMaxLength(500);

        builder.Property(t => t.Translations)
            .ConfigureTranslationsJsonb();

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.RejectionReason)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(t => t.TourScope)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.IsVisa)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(t => t.Continent)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired(false);

        builder.Property(t => t.CustomerSegment)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.IsDeleted)
            .HasDefaultValue(false);

        builder.HasIndex(t => new { t.Status, t.IsDeleted });
        builder.HasIndex(t => t.CreatedOnUtc);
        builder.HasIndex(t => t.TourDesignerId);
        builder.HasIndex(t => t.IsDeleted)
            .HasFilter("\"IsDeleted\" = false");

        // Thumbnail là owned entity, lưu inline trong bảng Tours
        builder.OwnsOne(t => t.Thumbnail, thumb =>
        {
            thumb.Property(i => i.FileId).HasColumnName("Thumbnail_FileId").HasMaxLength(200);
            thumb.Property(i => i.OriginalFileName).HasColumnName("Thumbnail_OriginalFileName").HasMaxLength(500);
            thumb.Property(i => i.FileName).HasColumnName("Thumbnail_FileName").HasMaxLength(500);
            thumb.Property(i => i.PublicURL).HasColumnName("Thumbnail_PublicURL").HasMaxLength(1000);
        });

        // Images lưu trong bảng riêng TourImages
        builder.OwnsMany(t => t.Images, img =>
        {
            img.ToTable("TourImages");
            img.WithOwner().HasForeignKey("TourId");
            img.Property<int>("Id").ValueGeneratedOnAdd().UseIdentityAlwaysColumn();
            img.HasKey("Id");
            img.Property(i => i.FileId).HasMaxLength(200);
            img.Property(i => i.OriginalFileName).HasMaxLength(500);
            img.Property(i => i.FileName).HasMaxLength(500);
            img.Property(i => i.PublicURL).HasMaxLength(1000);
        });

        builder.HasMany(t => t.Classifications)
            .WithOne(c => c.Tour)
            .HasForeignKey(c => c.TourId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.PlanLocations)
            .WithOne(l => l.Tour)
            .HasForeignKey(l => l.TourId)
            .OnDelete(DeleteBehavior.Cascade);




        // TourDesigner relationship
        builder.HasOne(t => t.TourDesigner)
            .WithMany()
            .HasForeignKey(t => t.TourDesignerId)
            .OnDelete(DeleteBehavior.SetNull);

    }
}
