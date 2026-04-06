namespace Infrastructure.Data.Configurations;

using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class GuestArrivalParticipantEntityConfiguration : IEntityTypeConfiguration<GuestArrivalParticipantEntity>
{
    public void Configure(EntityTypeBuilder<GuestArrivalParticipantEntity> builder)
    {
        builder.ToTable("GuestArrivalParticipants");

        builder.HasKey(x => x.Id);

        // Unique constraint: one participant link per guest arrival + booking participant
        builder.HasIndex(x => new { x.GuestArrivalId, x.BookingParticipantId }).IsUnique();

        builder.HasOne(x => x.GuestArrival)
            .WithMany(x => x.Participants)
            .HasForeignKey(x => x.GuestArrivalId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.BookingParticipant)
            .WithMany()
            .HasForeignKey(x => x.BookingParticipantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
