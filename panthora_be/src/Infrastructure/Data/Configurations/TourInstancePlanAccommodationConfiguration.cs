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
