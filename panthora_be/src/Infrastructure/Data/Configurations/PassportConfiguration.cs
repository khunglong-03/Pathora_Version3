using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PassportConfiguration : IEntityTypeConfiguration<PassportEntity>
{
    public void Configure(EntityTypeBuilder<PassportEntity> builder)
    {
        builder.ToTable("Passports");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.PassportNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Nationality)
            .HasMaxLength(100);

        builder.Property(x => x.FileUrl)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.BookingParticipantId).IsUnique();
        builder.HasIndex(x => x.PassportNumber).IsUnique();

        builder.HasOne(x => x.BookingParticipant)
            .WithOne(x => x.Passport)
            .HasForeignKey<PassportEntity>(x => x.BookingParticipantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
