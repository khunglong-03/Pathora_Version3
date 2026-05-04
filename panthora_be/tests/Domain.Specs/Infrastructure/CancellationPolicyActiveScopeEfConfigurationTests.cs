using global::Domain.Entities;
using global::Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure;

public sealed class CancellationPolicyActiveScopeEfConfigurationTests
{
    [Fact]
    public void CancellationPolicy_ShouldHaveUniqueActivePolicyIndexPerScope()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=metadata_only;Username=metadata;Password=metadata")
            .Options;

        using var context = new AppDbContext(options);
        var entityType = context.Model.FindEntityType(typeof(CancellationPolicyEntity));
        Assert.NotNull(entityType);
        var entity = entityType!;

        var index = entity.GetIndexes().SingleOrDefault(candidate =>
            candidate.IsUnique &&
            candidate.Properties.Select(property => property.Name)
                .SequenceEqual([nameof(CancellationPolicyEntity.TourScope)]));

        Assert.NotNull(index);
        Assert.Contains("Active", index!.GetFilter());
        Assert.Contains("IsDeleted", index.GetFilter());
    }
}
