namespace Infrastructure.Data.Configurations;

using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class GuestArrivalEntityConfiguration : IEntityTypeConfiguration<GuestArrivalEntity>
{
    public void Configure(EntityTypeBuilder<GuestArrivalEntity> builder)
    {
        builder.ToTable("GuestArrivals");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.SubmissionStatus)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Note)
            .HasMaxLength(1000);

        // One arrival record per accommodation detail
        builder.HasIndex(x => x.BookingAccommodationDetailId).IsUnique();

        builder.HasOne(x => x.BookingAccommodationDetail)
            .WithMany()
            .HasForeignKey(x => x.BookingAccommodationDetailId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
