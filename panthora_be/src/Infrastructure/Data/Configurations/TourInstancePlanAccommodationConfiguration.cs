using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourInstancePlanAccommodationConfiguration : IEntityTypeConfiguration<TourInstancePlanAccommodationEntity>
{
    public void Configure(EntityTypeBuilder<TourInstancePlanAccommodationEntity> builder)
    {
        builder.ToTable("TourInstancePlanAccommodations");

        builder.HasKey(e => e.Id);

        // Supplier (Hotel Provider) — per-accommodation activity
        builder.Property(e => e.SupplierId);

        builder.HasOne(e => e.Supplier)
            .WithMany()
            .HasForeignKey(e => e.SupplierId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.SupplierId);

        builder.Property(e => e.SupplierApprovalStatus)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(Domain.Enums.ProviderApprovalStatus.NotAssigned);

        builder.Property(e => e.SupplierApprovalNote)
            .HasMaxLength(500);

        builder.Property(e => e.RoomType)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(e => e.Quantity)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(e => e.CheckInTime);
        builder.Property(e => e.CheckOutTime);
    }
}
