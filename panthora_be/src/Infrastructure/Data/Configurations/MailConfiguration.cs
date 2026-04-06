using Domain.Mails;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class MailConfiguration : IEntityTypeConfiguration<MailEntity>
{
    public void Configure(EntityTypeBuilder<MailEntity> builder)
    {
        builder.ToTable("Mails");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.To)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(m => m.Subject)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(m => m.Body)
            .IsRequired();

        builder.Property(m => m.Template)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(m => m.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .HasDefaultValue(MailStatus.Pending);

        builder.Property(m => m.SentAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(m => m.CreatedAt)
            .IsRequired()
            .HasColumnType("timestamp with time zone");

        builder.HasIndex(m => m.Status);

        builder.HasIndex(m => m.CreatedAt);
    }
}
