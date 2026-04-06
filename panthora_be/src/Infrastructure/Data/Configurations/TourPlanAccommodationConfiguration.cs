using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourPlanAccommodationConfiguration : IEntityTypeConfiguration<TourPlanAccommodationEntity>
{
    public void Configure(EntityTypeBuilder<TourPlanAccommodationEntity> builder)
    {
        builder.ToTable("TourPlanAccommodations");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.AccommodationName)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(a => a.CheckInTime);

        builder.Property(a => a.CheckOutTime);

        builder.Property(a => a.RoomType)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(a => a.RoomCapacity)
            .IsRequired();

        builder.Property(a => a.RoomPrice)
            .HasColumnType("numeric(18,2)");

        builder.Property(a => a.MealsIncluded)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(a => a.SpecialRequest)
            .HasMaxLength(1000);

        builder.Property(a => a.Address)
            .HasMaxLength(500);

        builder.Property(a => a.ContactPhone)
            .HasMaxLength(50);

        builder.Property(a => a.NumberOfRooms);

        builder.Property(a => a.NumberOfNights);

        builder.Property(a => a.TotalPrice)
            .HasColumnType("numeric(18,2)");

        builder.Property(a => a.City)
            .HasMaxLength(200);

        builder.Property(a => a.Website)
            .HasMaxLength(500);

        builder.Property(a => a.ImageUrl)
            .HasMaxLength(1000);

        builder.Property(a => a.Latitude)
            .HasColumnType("numeric(10,7)");

        builder.Property(a => a.Longitude)
            .HasColumnType("numeric(10,7)");

        builder.Property(a => a.Note)
            .HasMaxLength(1000);

        builder.Property(a => a.Translations)
            .ConfigureTranslationsJsonb();

        builder.HasIndex("TourDayActivityId");
    }
}
