using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BookingParticipantConfiguration : IEntityTypeConfiguration<BookingParticipantEntity>
{
    public void Configure(EntityTypeBuilder<BookingParticipantEntity> builder)
    {
        builder.ToTable("BookingParticipants");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ParticipantType)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.FullName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Gender)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(x => x.Nationality)
            .HasMaxLength(100);

        builder.Property(x => x.DateOfBirth);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(x => x.BookingId);
        builder.HasIndex(x => x.ParticipantType);
        builder.HasIndex(x => x.Status);

        builder.HasOne(x => x.Booking)
            .WithMany(x => x.BookingParticipants)
            .HasForeignKey(x => x.BookingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
