using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Domain.Specs.Infrastructure.Repositories;

public sealed class VehicleBlockRepositoryRangeTests
{
    private static AppDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetByOwnerAndDateRangeAsync_FiltersByDateAndSupplier()
    {
        var ownerUserId = Guid.NewGuid();
        var supplierId1 = Guid.NewGuid();
        var supplierId2 = Guid.NewGuid(); // Not requested
        var from = new DateOnly(2026, 5, 1);
        var to = new DateOnly(2026, 5, 31);

        await using var context = CreateContext(Guid.NewGuid().ToString());

        var owner = UserEntity.Create("testuser", "Test User", "test@test.com", "hash", "tester");
        owner.Id = ownerUserId;
        owner.Status = UserStatus.Active;
        context.Users.Add(owner);

        var v1 = VehicleEntity.Create(VehicleType.Car, 4, ownerUserId, "test", brand: "S1 Car");
        v1.SupplierId = supplierId1;
        
        var v2 = VehicleEntity.Create(VehicleType.Car, 4, ownerUserId, "test", brand: "S2 Car");
        v2.SupplierId = supplierId2;

        context.Vehicles.AddRange(v1, v2);

        // Included block
        context.VehicleBlocks.Add(new VehicleBlockEntity
        {
            Id = Guid.NewGuid(),
            VehicleId = v1.Id,
            Vehicle = v1,
            BlockedDate = new DateOnly(2026, 5, 15),
            HoldStatus = HoldStatus.Hard
        });

        // Out of range block
        context.VehicleBlocks.Add(new VehicleBlockEntity
        {
            Id = Guid.NewGuid(),
            VehicleId = v1.Id,
            Vehicle = v1,
            BlockedDate = new DateOnly(2026, 6, 1), // June
            HoldStatus = HoldStatus.Hard
        });

        // Block for unrequested supplier
        context.VehicleBlocks.Add(new VehicleBlockEntity
        {
            Id = Guid.NewGuid(),
            VehicleId = v2.Id,
            Vehicle = v2,
            BlockedDate = new DateOnly(2026, 5, 15),
            HoldStatus = HoldStatus.Hard
        });

        await context.SaveChangesAsync();

        var repository = new VehicleBlockRepository(context);

        var projections = await repository.GetByOwnerAndDateRangeAsync(
            new List<Guid> { supplierId1 }, ownerUserId, from, to, null);

        Assert.Single(projections);
        Assert.Equal("S1 Car", projections[0].VehicleBrand);
        Assert.Equal(new DateOnly(2026, 5, 15), projections[0].BlockedDate);
    }
}
