using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Domain.Specs.Infrastructure.Repositories;

public sealed class VehicleRepositoryAvailabilityTests
{
    private static AppDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetAvailableBySupplierAsync_RespectsQuantityAndBlocks()
    {
        var ownerUserId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var date = new DateOnly(2026, 5, 1);
        await using var context = CreateContext(Guid.NewGuid().ToString());

        var owner = UserEntity.Create("testuser", "Test User", "test@test.com", "hash", "tester");
        owner.Id = ownerUserId;
        owner.Status = UserStatus.Active;
        context.Users.Add(owner);

        // Vehicle 1: 3 quantity, 3 blocks (fully booked)
        var v1 = VehicleEntity.Create(VehicleType.Car, 4, ownerUserId, "test", "Toyota", quantity: 3);
        v1.SupplierId = supplierId;
        context.Vehicles.Add(v1);
        for (int i = 0; i < 3; i++)
        {
            context.VehicleBlocks.Add(new VehicleBlockEntity
            {
                Id = Guid.NewGuid(),
                VehicleId = v1.Id,
                BlockedDate = date,
                HoldStatus = HoldStatus.Hard
            });
        }

        // Vehicle 2: 2 quantity, 1 block (1 available)
        var v2 = VehicleEntity.Create(VehicleType.Coach, 29, ownerUserId, "test", "Hyundai", quantity: 2);
        v2.SupplierId = supplierId;
        context.Vehicles.Add(v2);
        context.VehicleBlocks.Add(new VehicleBlockEntity
        {
            Id = Guid.NewGuid(),
            VehicleId = v2.Id,
            BlockedDate = date,
            HoldStatus = HoldStatus.Hard
        });

        // Vehicle 3: 1 quantity, 1 soft block expired (1 available)
        var v3 = VehicleEntity.Create(VehicleType.Car, 4, ownerUserId, "test", "Honda", quantity: 1);
        v3.SupplierId = supplierId;
        context.Vehicles.Add(v3);
        context.VehicleBlocks.Add(new VehicleBlockEntity
        {
            Id = Guid.NewGuid(),
            VehicleId = v3.Id,
            BlockedDate = date,
            HoldStatus = HoldStatus.Soft,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-10) // Expired
        });

        // Vehicle 4: 1 quantity, 1 hard block but on a DIFFERENT day (1 available)
        var v4 = VehicleEntity.Create(VehicleType.Car, 7, ownerUserId, "test", "Kia", quantity: 1);
        v4.SupplierId = supplierId;
        context.Vehicles.Add(v4);
        context.VehicleBlocks.Add(new VehicleBlockEntity
        {
            Id = Guid.NewGuid(),
            VehicleId = v4.Id,
            BlockedDate = date.AddDays(1),
            HoldStatus = HoldStatus.Hard
        });

        await context.SaveChangesAsync();

        var repository = new VehicleRepository(context);

        var results = await repository.GetAvailableBySupplierAsync(
            new List<Guid> { supplierId }, ownerUserId, null, date, null);

        // Expect v2, v3, v4
        Assert.Equal(3, results.Count);

        var r2 = results.Single(r => r.Vehicle.Id == v2.Id);
        Assert.Equal(1, r2.AvailableQuantity); // 2 total - 1 active block

        var r3 = results.Single(r => r.Vehicle.Id == v3.Id);
        Assert.Equal(1, r3.AvailableQuantity); // 1 total - 0 active blocks

        var r4 = results.Single(r => r.Vehicle.Id == v4.Id);
        Assert.Equal(1, r4.AvailableQuantity); // 1 total - 0 active blocks on this day
    }

    [Fact]
    public async Task GetAvailableBySupplierAsync_SelfExcludesActivityId()
    {
        var ownerUserId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var date = new DateOnly(2026, 5, 1);
        var activityId = Guid.NewGuid();
        await using var context = CreateContext(Guid.NewGuid().ToString());

        var owner = UserEntity.Create("testuser", "Test User", "test@test.com", "hash", "tester");
        owner.Id = ownerUserId;
        owner.Status = UserStatus.Active;
        context.Users.Add(owner);

        // Vehicle 1: 1 quantity, 1 block (but it belongs to the activity we are excluding)
        var v1 = VehicleEntity.Create(VehicleType.Car, 4, ownerUserId, "test", quantity: 1);
        v1.SupplierId = supplierId;
        context.Vehicles.Add(v1);

        context.VehicleBlocks.Add(new VehicleBlockEntity
        {
            Id = Guid.NewGuid(),
            VehicleId = v1.Id,
            TourInstanceDayActivityId = activityId,
            BlockedDate = date,
            HoldStatus = HoldStatus.Hard
        });

        await context.SaveChangesAsync();

        var repository = new VehicleRepository(context);

        // Exclude the activity
        var results = await repository.GetAvailableBySupplierAsync(
            new List<Guid> { supplierId }, ownerUserId, null, date, activityId);

        // It should be available because its only block is from the excluded activity
        Assert.Single(results);
        Assert.Equal(1, results[0].AvailableQuantity);
    }

    /// <summary>
    /// Availability is one row per <see cref="VehicleEntity"/> in the database, with
    /// <see cref="VehicleAvailabilityResult.AvailableQuantity"/> = units still free.
    /// A single fleet row with Quantity=6 still produces <b>one</b> result (id + availableQuantity 6),
    /// not six separate ids. UI that auto-fills N assignment rows from the list length
    /// only gets one vehicle id unless there are N separate vehicle records.
    /// </summary>
    [Fact]
    public async Task GetAvailableBySupplierAsync_OneCatalogRowWithQuantitySix_YieldsOneResultNotSix()
    {
        var ownerUserId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var date = new DateOnly(2026, 6, 1);
        await using var context = CreateContext(Guid.NewGuid().ToString());

        var owner = UserEntity.Create("testuser", "Test User", "test@test.com", "hash", "tester");
        owner.Id = ownerUserId;
        owner.Status = UserStatus.Active;
        context.Users.Add(owner);

        var bulk = VehicleEntity.Create(VehicleType.Car, 4, ownerUserId, "test", "Bulk", quantity: 6);
        bulk.SupplierId = supplierId;
        context.Vehicles.Add(bulk);

        await context.SaveChangesAsync();

        var repository = new VehicleRepository(context);

        var carOnly = await repository.GetAvailableBySupplierAsync(
            new List<Guid> { supplierId }, ownerUserId, VehicleType.Car, date, null);

        Assert.Single(carOnly);
        Assert.Equal(6, carOnly[0].AvailableQuantity);
    }

    [Fact]
    public async Task GetAvailableBySupplierAsync_SixSeparateVehicleRows_YieldsSixResults()
    {
        var ownerUserId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var date = new DateOnly(2026, 6, 2);
        await using var context = CreateContext(Guid.NewGuid().ToString());

        var owner = UserEntity.Create("testuser", "Test User", "test@test.com", "hash", "tester");
        owner.Id = ownerUserId;
        owner.Status = UserStatus.Active;
        context.Users.Add(owner);

        for (var i = 0; i < 6; i++)
        {
            var v = VehicleEntity.Create(VehicleType.Car, 4, ownerUserId, "test", $"Car{i}", quantity: 1);
            v.SupplierId = supplierId;
            context.Vehicles.Add(v);
        }

        await context.SaveChangesAsync();

        var repository = new VehicleRepository(context);

        var carOnly = await repository.GetAvailableBySupplierAsync(
            new List<Guid> { supplierId }, ownerUserId, VehicleType.Car, date, null);

        Assert.Equal(6, carOnly.Count);
    }
}
