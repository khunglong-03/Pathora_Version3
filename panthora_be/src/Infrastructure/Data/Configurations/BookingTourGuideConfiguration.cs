using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BookingTourGuideConfiguration : IEntityTypeConfiguration<BookingTourGuideEntity>
{
    public void Configure(EntityTypeBuilder<BookingTourGuideEntity> builder)
    {
        builder.ToTable("BookingTourGuides");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.AssignedRole)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.IsLead)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(x => x.Note)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.BookingId);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => new { x.BookingId, x.AssignedRole });

        builder.HasOne(x => x.Booking)
            .WithMany(x => x.BookingTourGuides)
            .HasForeignKey(x => x.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
