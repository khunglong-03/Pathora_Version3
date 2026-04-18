namespace Domain.Specs.Infrastructure.Repositories;

using Domain.Entities;
using Domain.Enums;
using global::Infrastructure.Data;
using global::Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

public sealed class SupplierRepositoryHotelProviderGeographyTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task FindOwnerUserIdsByHotelProviderContinentsAsync_UsesPrimaryContinentOnlyWhenNoDerivedGeographyExists()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var repository = new SupplierRepository(context);

        var ownerWithFallback = Guid.NewGuid();
        var ownerWithDerivedMismatch = Guid.NewGuid();

        var fallbackSupplier = SupplierEntity.Create(
            "SUP-005",
            SupplierType.Accommodation,
            "Fallback Hotel",
            "system",
            continent: Continent.Americas,
            ownerUserId: ownerWithFallback);
        var derivedSupplier = SupplierEntity.Create(
            "SUP-006",
            SupplierType.Accommodation,
            "Derived Hotel",
            "system",
            continent: Continent.Americas,
            ownerUserId: ownerWithDerivedMismatch);

        context.Suppliers.AddRange(fallbackSupplier, derivedSupplier);
        context.HotelRoomInventories.Add(
            HotelRoomInventoryEntity.Create(
                derivedSupplier.Id,
                RoomType.Standard,
                12,
                "system",
                name: "Derived Hotel Inventory",
                locationArea: Continent.Europe));
        await context.SaveChangesAsync();

        var matchedOwnerIds = await repository.FindOwnerUserIdsByHotelProviderContinentsAsync(
            [Continent.Americas],
            CancellationToken.None);

        Assert.Contains(ownerWithFallback, matchedOwnerIds);
        Assert.DoesNotContain(ownerWithDerivedMismatch, matchedOwnerIds);
    }

    [Fact]
    public async Task GetHotelProviderAdminDataGroupedByOwnerAsync_FallsBackToPrimaryContinentBeforeInventoryExists()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var repository = new SupplierRepository(context);

        var ownerUserId = Guid.NewGuid();
        var supplier = SupplierEntity.Create(
            "SUP-007",
            SupplierType.Accommodation,
            "Fallback Geography Hotel",
            "system",
            phone: "0123",
            email: "fallback@example.com",
            continent: Continent.Asia,
            ownerUserId: ownerUserId);

        context.Suppliers.Add(supplier);
        await context.SaveChangesAsync();

        var result = await repository.GetHotelProviderAdminDataGroupedByOwnerAsync([ownerUserId], CancellationToken.None);

        var data = Assert.Single(result);
        Assert.Equal(ownerUserId, data.Key);
        Assert.Equal(Continent.Asia, data.Value.PrimaryContinent);
        Assert.Equal([Continent.Asia], data.Value.Continents);
        Assert.Equal(0, data.Value.AccommodationCount);
        Assert.Equal(0, data.Value.RoomCount);
    }

    [Fact]
    public async Task GetHotelProviderAdminDataGroupedByOwnerAsync_PrefersDerivedContinentsOverPrimaryContinent()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var repository = new SupplierRepository(context);

        var ownerUserId = Guid.NewGuid();
        var supplier = SupplierEntity.Create(
            "SUP-008",
            SupplierType.Accommodation,
            "Derived Geography Hotel",
            "system",
            continent: Continent.Asia,
            ownerUserId: ownerUserId);

        context.Suppliers.Add(supplier);
        context.HotelRoomInventories.AddRange(
            HotelRoomInventoryEntity.Create(
                supplier.Id,
                RoomType.Standard,
                10,
                "system",
                name: "Derived Hotel A",
                locationArea: Continent.Europe),
            HotelRoomInventoryEntity.Create(
                supplier.Id,
                RoomType.Deluxe,
                6,
                "system",
                name: "Derived Hotel B",
                locationArea: Continent.Africa));
        await context.SaveChangesAsync();

        var result = await repository.GetHotelProviderAdminDataGroupedByOwnerAsync([ownerUserId], CancellationToken.None);

        var data = Assert.Single(result);
        Assert.Equal(Continent.Asia, data.Value.PrimaryContinent);
        Assert.Equal([Continent.Europe, Continent.Africa], data.Value.Continents);
        Assert.Equal(2, data.Value.AccommodationCount);
        Assert.Equal(16, data.Value.RoomCount);
    }
}
