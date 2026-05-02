using global::Domain.Entities;
using global::Domain.Enums;
using global::Infrastructure.Data;
using global::Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure.Repositories;

public sealed class SupplierRepositoryFindAllByOwnerUserIdTests
{
    private static AppDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task FindAllByOwnerUserIdAsync_ReturnsMultipleNonDeletedSuppliers_ForOwner()
    {
        var ownerUserId = Guid.NewGuid();
        var otherOwnerUserId = Guid.NewGuid();

        await using var context = CreateContext(Guid.NewGuid().ToString());
        var deletedSupplier = SupplierEntity.Create(
            "HOTEL-004",
            SupplierType.Accommodation,
            "Hotel Deleted",
            "tester",
            ownerUserId: ownerUserId);
        deletedSupplier.IsDeleted = true;
        deletedSupplier.IsActive = false;

        context.Suppliers.AddRange(
            SupplierEntity.Create("HOTEL-001", SupplierType.Accommodation, "Hotel Alpha", "tester", ownerUserId: ownerUserId),
            SupplierEntity.Create("HOTEL-002", SupplierType.Accommodation, "Hotel Beta", "tester", ownerUserId: ownerUserId),
            SupplierEntity.Create("HOTEL-003", SupplierType.Accommodation, "Hotel Gamma", "tester", ownerUserId: otherOwnerUserId),
            deletedSupplier);
        await context.SaveChangesAsync();

        var repository = new SupplierRepository(context);

        var result = await repository.FindAllByOwnerUserIdAsync(ownerUserId);

        Assert.Equal(2, result.Count);
        Assert.Equal(["Hotel Alpha", "Hotel Beta"], result.Select(s => s.Name).ToArray());
        Assert.All(result, supplier => Assert.Equal(ownerUserId, supplier.OwnerUserId));
    }
}
