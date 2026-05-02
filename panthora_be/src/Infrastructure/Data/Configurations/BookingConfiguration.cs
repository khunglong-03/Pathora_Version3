using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<BookingEntity>
{
    public void Configure(EntityTypeBuilder<BookingEntity> builder)
    {
        builder.ToTable("Bookings");

        builder.HasKey(b => b.Id);

        // Customer info
        builder.Property(b => b.CustomerName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(b => b.CustomerPhone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(b => b.CustomerEmail)
            .HasMaxLength(200);

        // Participants
        builder.Property(b => b.NumberAdult).IsRequired();
        builder.Property(b => b.NumberChild).HasDefaultValue(0);
        builder.Property(b => b.NumberInfant).HasDefaultValue(0);

        // Payment
        builder.Property(b => b.TotalPrice)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(b => b.PaymentMethod)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(b => b.IsFullPay).IsRequired();

        builder.Property(b => b.BookingType)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        // Status & dates
        builder.Property(b => b.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(b => b.BookingDate).IsRequired();

        builder.Property(b => b.CancelReason)
            .HasMaxLength(1000);

        builder.Property(b => b.CancelledAt);

        // Indexes
        builder.HasIndex(b => b.Status);
        builder.HasIndex(b => b.TourInstanceId);
        builder.HasIndex(b => b.UserId);
        builder.HasIndex(b => b.BookingDate);
        builder.HasIndex(b => b.TourRequestId);
        // Composite indexes for common query patterns
        builder.HasIndex(b => new { b.Status, b.TourInstanceId });
        builder.HasIndex(b => new { b.Status, b.UserId });
        builder.HasIndex(b => new { b.UserId, b.TourInstanceId });

        // Relationships
        builder.HasOne(b => b.TourInstance)
            .WithMany(t => t.Bookings)
            .HasForeignKey(b => b.TourInstanceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.TourRequest)
            .WithMany(t => t.Bookings)
            .HasForeignKey(b => b.TourRequestId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(b => b.Deposits)
            .WithOne(d => d.Booking)
            .HasForeignKey(d => d.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.Payments)
            .WithOne(p => p.Booking)
            .HasForeignKey(p => p.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.BookingActivityReservations)
            .WithOne(r => r.Booking)
            .HasForeignKey(r => r.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.BookingParticipants)
            .WithOne(p => p.Booking)
            .HasForeignKey(p => p.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.BookingTourGuides)
            .WithOne(g => g.Booking)
            .HasForeignKey(g => g.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.SupplierPayables)
            .WithOne(p => p.Booking)
            .HasForeignKey(p => p.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.PaymentTransactions)
            .WithOne(t => t.Booking)
            .HasForeignKey(t => t.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(b => b.TransactionHistories)
            .WithOne(h => h.Booking)
            .HasForeignKey(h => h.BookingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(b => b.TourDayActivityStatuses)
            .WithOne(s => s.Booking)
            .HasForeignKey(s => s.BookingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
