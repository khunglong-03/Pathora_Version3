using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourManagerAssignmentConfiguration : IEntityTypeConfiguration<TourManagerAssignmentEntity>
{
    public void Configure(EntityTypeBuilder<TourManagerAssignmentEntity> builder)
    {
        builder.ToTable("tour_manager_assignment");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.TourManagerId)
            .IsRequired();

        builder.Property(m => m.AssignedEntityType)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(m => m.AssignedRoleInTeam)
            .HasConversion<string>();

        builder.Property(m => m.CreatedBy)
            .HasMaxLength(100);

        builder.Property(m => m.LastModifiedBy)
            .HasMaxLength(100);

        builder.HasOne(m => m.TourManager)
            .WithMany()
            .HasForeignKey(m => m.TourManagerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.AssignedUser)
            .WithMany()
            .HasForeignKey(m => m.AssignedUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.AssignedTour)
            .WithMany()
            .HasForeignKey(m => m.AssignedTourId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(m => m.TourManagerId);
        builder.HasIndex(m => m.AssignedUserId);
        builder.HasIndex(m => m.AssignedTourId);
        builder.HasIndex(m => m.AssignedEntityType);
    }
}
