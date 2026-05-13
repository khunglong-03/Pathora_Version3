using global::Domain.Entities;
using global::Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure;

public sealed class BookingCancellationRequestEfConfigurationTests
{
    [Fact]
    public void BookingCancellationRequest_ShouldHaveRequiredEfMapping()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=metadata_only;Username=metadata;Password=metadata")
            .Options;

        using var context = new AppDbContext(options);

        var entityType = context.Model.FindEntityType(typeof(BookingCancellationRequestEntity));
        Assert.NotNull(entityType);
        var entity = entityType!;

        Assert.Equal("BookingCancellationRequests", entity.GetTableName());
        Assert.NotNull(entity.FindPrimaryKey());

        Assert.Contains(entity.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(BookingEntity) &&
            fk.Properties.Select(p => p.Name).SequenceEqual([nameof(BookingCancellationRequestEntity.BookingId)]));

        Assert.Equal(
            "numeric(18,2)",
            entity.FindProperty(nameof(BookingCancellationRequestEntity.RefundAmount))!.GetColumnType());
        Assert.Equal(
            "numeric(18,2)",
            entity.FindProperty(nameof(BookingCancellationRequestEntity.PaidAmountSnapshot))!.GetColumnType());

        var pendingIndex = entity.GetIndexes().SingleOrDefault(index =>
            index.IsUnique &&
            index.Properties.Select(property => property.Name)
                .SequenceEqual([nameof(BookingCancellationRequestEntity.BookingId)]));

        Assert.NotNull(pendingIndex);
        Assert.Contains("PendingManagerReview", pendingIndex!.GetFilter());
    }
}
