using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourInstanceDayConfiguration : IEntityTypeConfiguration<TourInstanceDayEntity>
{
    public void Configure(EntityTypeBuilder<TourInstanceDayEntity> builder)
    {
        builder.ToTable("TourInstanceDays");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(t => t.Description)
            .HasMaxLength(2000);

        builder.Property(t => t.Note)
            .HasMaxLength(1000);

        builder.Property(t => t.StartTime)
            .HasColumnType("time without time zone");

        builder.Property(t => t.EndTime)
            .HasColumnType("time without time zone");

        builder.Property(t => t.InstanceDayNumber)
            .IsRequired();

        builder.Property(t => t.ActualDate)
            .IsRequired();

        builder.Property(t => t.Translations)
            .ConfigureTranslationsJsonb();

        builder.HasIndex(t => t.TourInstanceId);

        builder.HasIndex(t => new { t.TourInstanceId, t.InstanceDayNumber })
            .IsUnique();

        builder.HasOne(t => t.TourInstance)
            .WithMany(i => i.InstanceDays)
            .HasForeignKey(t => t.TourInstanceId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasOne(t => t.TourDay)
            .WithMany()
            .HasForeignKey(t => t.TourDayId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();
    }
}
