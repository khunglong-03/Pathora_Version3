using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class VisaApplicationConfiguration : IEntityTypeConfiguration<VisaApplicationEntity>
{
    public void Configure(EntityTypeBuilder<VisaApplicationEntity> builder)
    {
        builder.ToTable("VisaApplications");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.DestinationCountry)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.RefusalReason)
            .HasMaxLength(1000);

        builder.Property(x => x.VisaFileUrl)
            .HasMaxLength(1000);

        builder.HasIndex(x => new { x.BookingParticipantId, x.Status });
        builder.HasIndex(x => x.ServiceFeeTransactionId);
        builder.HasIndex(x => x.PassportId);

        // Unique filtered index để mỗi participant chỉ có tối đa 1 application active (Pending, Processing, Approved) tại một thời điểm
        builder.HasIndex(x => x.BookingParticipantId)
            .IsUnique()
            .HasFilter("\"Status\" IN ('Pending', 'Processing', 'Approved')");

        builder.HasOne(x => x.BookingParticipant)
            .WithMany(x => x.VisaApplications)
            .HasForeignKey(x => x.BookingParticipantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Passport)
            .WithMany(x => x.VisaApplications)
            .HasForeignKey(x => x.PassportId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Visa)
            .WithOne(a => a.VisaApplication)
            .HasForeignKey<VisaEntity>(v => v.VisaApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
