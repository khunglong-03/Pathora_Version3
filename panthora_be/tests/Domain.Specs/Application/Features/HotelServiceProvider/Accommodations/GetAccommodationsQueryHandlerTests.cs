namespace Domain.Specs.Application.Features.HotelServiceProvider.Accommodations;

using Application.Features.HotelServiceProvider.Accommodations.DTOs;
using Application.Features.HotelServiceProvider.Accommodations.Queries;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using global::Contracts.Interfaces;
using NSubstitute;
using Xunit;

public sealed class GetAccommodationsQueryHandlerTests
{
    private readonly IHotelRoomInventoryRepository _inventoryRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly IUser _user;
    private readonly GetAccommodationsQueryHandler _handler;

    public GetAccommodationsQueryHandlerTests()
    {
        _inventoryRepository = Substitute.For<IHotelRoomInventoryRepository>();
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _user = Substitute.For<IUser>();
        _handler = new GetAccommodationsQueryHandler(_inventoryRepository, _supplierRepository, _user);
    }

    [Fact]
    public async Task Handle_TC01_SupplierExists_ReturnsInventoryList()
    {
        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());

        var supplier = new SupplierEntity
        {
            Id = supplierId,
            Name = "Grand Hotel",
            SupplierType = SupplierType.Accommodation
        };
        _supplierRepository.FindByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(supplier);

        var inventories = new List<HotelRoomInventoryEntity>
        {
            CreateInventory(supplierId, RoomType.Standard, 10, "Hotel Grand"),
            CreateInventory(supplierId, RoomType.Deluxe, 5, "Hotel Grand"),
        };
        _inventoryRepository.GetByHotelAsync(supplierId, Arg.Any<CancellationToken>())
            .Returns(inventories);

        var query = new GetAccommodationsQuery();
        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.Count);
        Assert.Equal("Standard", result.Value[0].RoomType);
        Assert.Equal(10, result.Value[0].TotalRooms);
        Assert.Equal("Hotel Grand", result.Value[0].Name);
        Assert.Equal("Deluxe", result.Value[1].RoomType);
        Assert.Equal(5, result.Value[1].TotalRooms);
    }

    [Fact]
    public async Task Handle_TC02_NoSupplier_ReturnsEmptyList()
    {
        var userId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());

        _supplierRepository.FindByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns((SupplierEntity?)null);

        var query = new GetAccommodationsQuery();
        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Empty(result.Value);
        await _inventoryRepository.Received(0).GetByHotelAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_TC03_UserNotAuthenticated_ReturnsUnauthorized()
    {
        _user.Id.Returns((string?)null);

        var query = new GetAccommodationsQuery();
        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("Unauthorized", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_TC04_NoInventories_ReturnsEmptyList()
    {
        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());

        var supplier = new SupplierEntity
        {
            Id = supplierId,
            Name = "Hotel No Rooms",
            SupplierType = SupplierType.Accommodation
        };
        _supplierRepository.FindByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(supplier);

        _inventoryRepository.GetByHotelAsync(supplierId, Arg.Any<CancellationToken>())
            .Returns(new List<HotelRoomInventoryEntity>());

        var query = new GetAccommodationsQuery();
        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Empty(result.Value);
    }

    [Fact]
    public async Task Handle_TC05_AllRoomTypesMapped_ToString()
    {
        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());

        var supplier = new SupplierEntity
        {
            Id = supplierId,
            Name = "Hotel Types",
            SupplierType = SupplierType.Accommodation
        };
        _supplierRepository.FindByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(supplier);

        var inventories = new List<HotelRoomInventoryEntity>
        {
            CreateInventory(supplierId, RoomType.Single, 3),
            CreateInventory(supplierId, RoomType.Double, 2),
            CreateInventory(supplierId, RoomType.Twin, 2),
            CreateInventory(supplierId, RoomType.Triple, 2),
            CreateInventory(supplierId, RoomType.Family, 4),
            CreateInventory(supplierId, RoomType.Suite, 1),
            CreateInventory(supplierId, RoomType.Dormitory, 10),
        };
        _inventoryRepository.GetByHotelAsync(supplierId, Arg.Any<CancellationToken>())
            .Returns(inventories);

        var query = new GetAccommodationsQuery();
        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(7, result.Value.Count);
        Assert.Equal("Single", result.Value[0].RoomType);
        Assert.Equal("Double", result.Value[1].RoomType);
        Assert.Equal("Twin", result.Value[2].RoomType);
        Assert.Equal("Triple", result.Value[3].RoomType);
        Assert.Equal("Family", result.Value[4].RoomType);
        Assert.Equal("Suite", result.Value[5].RoomType);
        Assert.Equal("Dormitory", result.Value[6].RoomType);
    }

    [Fact]
    public async Task Handle_TC06_InventoryWithOptionalFields_FieldsAreMapped()
    {
        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());

        var supplier = new SupplierEntity
        {
            Id = supplierId,
            Name = "Hotel With Fields",
            SupplierType = SupplierType.Accommodation
        };
        _supplierRepository.FindByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(supplier);

        var inventory = new HotelRoomInventoryEntity
        {
            Id = Guid.NewGuid(),
            SupplierId = supplierId,
            RoomType = RoomType.Deluxe,
            TotalRooms = 5,
            Name = "Deluxe Suite",
            Address = "123 Hotel St",
            LocationArea = Continent.Europe,
            OperatingCountries = "DE",
            ImageUrls = "https://img.com/deluxe.jpg",
            Notes = "Ocean view"
        };
        _inventoryRepository.GetByHotelAsync(supplierId, Arg.Any<CancellationToken>())
            .Returns(new List<HotelRoomInventoryEntity> { inventory });

        var query = new GetAccommodationsQuery();
        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value);
        var dto = result.Value[0];
        Assert.Equal("Deluxe Suite", dto.Name);
        Assert.Equal("123 Hotel St", dto.Address);
        Assert.Equal("Europe", dto.LocationArea);
        Assert.Equal("DE", dto.OperatingCountries);
        Assert.Equal("https://img.com/deluxe.jpg", dto.ImageUrls);
        Assert.Equal("Ocean view", dto.Notes);
    }

    [Fact]
    public async Task Handle_TC07_SupplierAccommodationType_FiltersOnlyAccommodation()
    {
        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());

        var supplier = new SupplierEntity
        {
            Id = supplierId,
            Name = "Transport Supplier",
            SupplierType = SupplierType.Accommodation
        };
        _supplierRepository.FindByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(supplier);

        var inventory = new List<HotelRoomInventoryEntity>
        {
            CreateInventory(supplierId, RoomType.Standard, 10),
        };
        _inventoryRepository.GetByHotelAsync(supplierId, Arg.Any<CancellationToken>())
            .Returns(inventory);

        var query = new GetAccommodationsQuery();
        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value);
    }

    private static HotelRoomInventoryEntity CreateInventory(
        Guid supplierId,
        RoomType roomType,
        int totalRooms,
        string? name = null)
    {
        return new HotelRoomInventoryEntity
        {
            Id = Guid.NewGuid(),
            SupplierId = supplierId,
            RoomType = roomType,
            TotalRooms = totalRooms,
            Name = name,
            Address = null,
            LocationArea = null,
            OperatingCountries = null,
            ImageUrls = null,
            Notes = null,
            CreatedBy = "system",
            LastModifiedBy = "system",
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow,
        };
    }
}
