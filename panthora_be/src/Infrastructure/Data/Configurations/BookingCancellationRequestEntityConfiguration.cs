using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public sealed class BookingCancellationRequestEntityConfiguration : IEntityTypeConfiguration<BookingCancellationRequestEntity>
{
    public void Configure(EntityTypeBuilder<BookingCancellationRequestEntity> builder)
    {
        builder.ToTable("BookingCancellationRequests");

        builder.HasKey(request => request.Id);

        builder.Property(request => request.TourScopeSnapshot)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(request => request.FeePercent)
            .IsRequired();

        builder.Property(request => request.PaidAmountSnapshot)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(request => request.RefundAmount)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(request => request.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(request => request.CustomerReason)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(request => request.PreviousBookingStatus)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(request => request.ManagerNote)
            .HasMaxLength(500);

        builder.Property(request => request.RefundProofNote)
            .HasMaxLength(500);

        builder.Property(request => request.CreatedAt)
            .IsRequired();

        builder.HasOne(request => request.Booking)
            .WithMany()
            .HasForeignKey(request => request.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(request => request.BookingId)
            .IsUnique()
            .HasFilter("\"Status\" = 'PendingManagerReview'");

        builder.HasIndex(request => request.Status);
        builder.HasIndex(request => request.CreatedAt);
        builder.HasIndex(request => request.RequestedByUserId);
    }
}
