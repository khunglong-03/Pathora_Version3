namespace Domain.Specs.Application.Features.Admin.Queries;

using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using global::Application.Features.Admin.Queries.GetHotelProviderById;
using NSubstitute;
using Xunit;

public sealed class GetHotelProviderByIdQueryHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly IHotelRoomInventoryRepository _inventoryRepository;
    private readonly GetHotelProviderByIdQueryHandler _handler;

    public GetHotelProviderByIdQueryHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _inventoryRepository = Substitute.For<IHotelRoomInventoryRepository>();
        _handler = new GetHotelProviderByIdQueryHandler(_userRepository, _supplierRepository, _inventoryRepository);
    }

    [Fact]
    public async Task Handle_WithoutAccommodationGeography_FallsBackToPrimaryContinent()
    {
        var ownerUserId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = ownerUserId,
            FullName = "No Inventory Hotel",
            Email = "hotel@example.com",
            PhoneNumber = "+84 123 456 789",
            Status = UserStatus.Active
        };
        var supplier = SupplierEntity.Create(
            "SUP-001",
            SupplierType.Accommodation,
            "No Inventory Hotel",
            "system",
            ownerUserId: ownerUserId,
            continent: Continent.Asia);

        _userRepository.FindById(ownerUserId, Arg.Any<CancellationToken>()).Returns(user);
        _supplierRepository.FindByOwnerUserIdAsync(ownerUserId, Arg.Any<CancellationToken>()).Returns(supplier);
        _supplierRepository.GetHotelBookingCountsByOwnerAsync(ownerUserId, Arg.Any<CancellationToken>())
            .Returns((0, 0, 0));
        _inventoryRepository.GetByHotelAsync(supplier.Id, Arg.Any<CancellationToken>())
            .Returns(Array.Empty<HotelRoomInventoryEntity>());

        var result = await _handler.Handle(new GetHotelProviderByIdQuery(ownerUserId), CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("Asia", result.Value.PrimaryContinent);
        Assert.Equal(["Asia"], result.Value.Continents);
        Assert.Empty(result.Value.Accommodations);
    }

    [Fact]
    public async Task Handle_WithAccommodationGeography_PrefersDerivedContinents()
    {
        var ownerUserId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = ownerUserId,
            FullName = "Derived Geography Hotel",
            Email = "derived@example.com",
            Status = UserStatus.Active
        };
        var supplier = SupplierEntity.Create(
            "SUP-002",
            SupplierType.Accommodation,
            "Derived Geography Hotel",
            "system",
            ownerUserId: ownerUserId,
            continent: Continent.Americas);
        var inventories = new[]
        {
            HotelRoomInventoryEntity.Create(supplier.Id, RoomType.Standard, 10, "system", name: "Hotel A", locationArea: Continent.Europe),
            HotelRoomInventoryEntity.Create(supplier.Id, RoomType.Deluxe, 5, "system", name: "Hotel B", locationArea: Continent.Africa)
        };

        _userRepository.FindById(ownerUserId, Arg.Any<CancellationToken>()).Returns(user);
        _supplierRepository.FindByOwnerUserIdAsync(ownerUserId, Arg.Any<CancellationToken>()).Returns(supplier);
        _supplierRepository.GetHotelBookingCountsByOwnerAsync(ownerUserId, Arg.Any<CancellationToken>())
            .Returns((3, 1, 2));
        _inventoryRepository.GetByHotelAsync(supplier.Id, Arg.Any<CancellationToken>())
            .Returns(inventories);

        var result = await _handler.Handle(new GetHotelProviderByIdQuery(ownerUserId), CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("Americas", result.Value.PrimaryContinent);
        Assert.Equal(["Europe", "Africa"], result.Value.Continents);
        Assert.Equal(2, result.Value.AccommodationCount);
        Assert.Equal(15, result.Value.TotalRooms);
    }
}
