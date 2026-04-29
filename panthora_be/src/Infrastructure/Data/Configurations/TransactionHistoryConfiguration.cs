using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TransactionHistoryConfiguration : IEntityTypeConfiguration<TransactionHistoryEntity>
{
    public void Configure(EntityTypeBuilder<TransactionHistoryEntity> builder)
    {
        builder.ToTable("TransactionHistories");

        builder.HasKey(h => h.Id);

        builder.Property(h => h.Amount)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(h => h.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.HasIndex(h => h.UserId);
        builder.HasIndex(h => h.BookingId);
        builder.HasIndex(h => h.CreatedOnUtc);
    }
}
