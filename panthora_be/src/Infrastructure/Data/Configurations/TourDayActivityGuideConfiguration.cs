using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TourDayActivityGuideConfiguration : IEntityTypeConfiguration<TourDayActivityGuideEntity>
{
    public void Configure(EntityTypeBuilder<TourDayActivityGuideEntity> builder)
    {
        builder.ToTable("TourDayActivityGuides");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Role)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Note)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.TourDayActivityStatusId);
        builder.HasIndex(x => x.UserId);

        builder.HasOne(x => x.TourDayActivityStatus)
            .WithMany(x => x.ActivityGuides)
            .HasForeignKey(x => x.TourDayActivityStatusId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
