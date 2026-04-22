namespace Domain.Specs.Application.Features.Admin.Queries;

using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using NSubstitute;
using global::Contracts;
using TpQry = global::Application.Features.Admin.Queries.GetTransportProviders;
using Xunit;

public sealed class GetTransportProvidersQueryHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly TpQry.GetTransportProvidersQueryHandler _handler;

    public GetTransportProvidersQueryHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _vehicleRepository = Substitute.For<IVehicleRepository>();
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _handler = new TpQry.GetTransportProvidersQueryHandler(_vehicleRepository, _userRepository, _supplierRepository);
    }

    [Fact]
    public async Task Handle_ReturnsTransportProvidersFromUserRepository()
    {
        var providerId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = providerId,
            FullName = "Taxi Service Co",
            Email = "transport@example.com",
            PhoneNumber = "+84 111 222 333",
            AvatarUrl = "https://example.com/transport.jpg",
            Status = UserStatus.Active
        };
        _userRepository.FindProvidersByRoleAsync(6, null, null, 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity> { user });
        _userRepository.CountProvidersByRoleAsync(6, null, null, Arg.Any<CancellationToken>())
            .Returns(1);
        _userRepository.CountProvidersByRoleAsync(6, null, "Pending", Arg.Any<CancellationToken>())
            .Returns(0);
        _vehicleRepository.GetVehicleDataGroupedByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (int Count, List<Continent> Continents)>());
        _supplierRepository.GetTransportSupplierAddressByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (string? Address, Continent? PrimaryContinent)>());

        var query = new TpQry.GetTransportProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        var item = result.Value.Items[0];
        Assert.Equal("Taxi Service Co", item.FullName);
        Assert.Equal("transport@example.com", item.Email);
        Assert.Equal("+84 111 222 333", item.PhoneNumber);
        Assert.Equal("https://example.com/transport.jpg", item.AvatarUrl);
        Assert.Equal(UserStatus.Active, item.Status);
        Assert.Equal(0, item.VehicleCount);
        Assert.Equal(1, result.Value.Total);
        Assert.Equal(1, result.Value.PageNumber);
        Assert.Equal(10, result.Value.PageSize);
    }

    [Fact]
    public async Task Handle_NoTransportProviders_ReturnsEmptyList()
    {
        _userRepository.FindProvidersByRoleAsync(6, null, null, 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity>());
        _userRepository.CountProvidersByRoleAsync(6, null, null, Arg.Any<CancellationToken>())
            .Returns(0);
        _userRepository.CountProvidersByRoleAsync(6, null, "Pending", Arg.Any<CancellationToken>())
            .Returns(0);
        _vehicleRepository.GetVehicleDataGroupedByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (int Count, List<Continent> Continents)>());
        _supplierRepository.GetTransportSupplierAddressByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (string? Address, Continent? PrimaryContinent)>());

        var query = new TpQry.GetTransportProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Empty(result.Value.Items);
        Assert.Equal(0, result.Value.Total);
    }

    [Fact]
    public async Task Handle_WithSearch_FiltersResults()
    {
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            FullName = "Taxi Express",
            Email = "taxi@example.com",
            Status = UserStatus.Active
        };
        _userRepository.FindProvidersByRoleAsync(6, "taxi", null, 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity> { user });
        _userRepository.CountProvidersByRoleAsync(6, "taxi", null, Arg.Any<CancellationToken>())
            .Returns(1);
        _userRepository.CountProvidersByRoleAsync(6, "taxi", "Pending", Arg.Any<CancellationToken>())
            .Returns(0);
        _vehicleRepository.GetVehicleDataGroupedByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (int Count, List<Continent> Continents)>());
        _supplierRepository.GetTransportSupplierAddressByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (string? Address, Continent? PrimaryContinent)>());

        var query = new TpQry.GetTransportProvidersQuery(1, 10, "taxi", null);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        await _userRepository.Received(1).FindProvidersByRoleAsync(6, "taxi", null, 1, 10, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithActiveStatus_FiltersActiveUsers()
    {
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            FullName = "Active Taxi",
            Email = "active@example.com",
            Status = UserStatus.Active
        };
        _userRepository.FindProvidersByRoleAsync(6, null, "Active", 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity> { user });
        _userRepository.CountProvidersByRoleAsync(6, null, "Active", Arg.Any<CancellationToken>())
            .Returns(1);
        _userRepository.CountProvidersByRoleAsync(6, null, "Pending", Arg.Any<CancellationToken>())
            .Returns(0);
        _vehicleRepository.GetVehicleDataGroupedByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (int Count, List<Continent> Continents)>());
        _supplierRepository.GetTransportSupplierAddressByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (string? Address, Continent? PrimaryContinent)>());

        var query = new TpQry.GetTransportProvidersQuery(1, 10, null, "Active");

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        Assert.Equal(UserStatus.Active, result.Value.Items[0].Status);
    }

    [Fact]
    public async Task Handle_WithInactiveStatus_FiltersInactiveUsers()
    {
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            FullName = "Inactive Taxi",
            Email = "inactive@example.com",
            Status = UserStatus.Inactive
        };
        _userRepository.FindProvidersByRoleAsync(6, null, "Inactive", 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity> { user });
        _userRepository.CountProvidersByRoleAsync(6, null, "Inactive", Arg.Any<CancellationToken>())
            .Returns(1);
        _userRepository.CountProvidersByRoleAsync(6, null, "Pending", Arg.Any<CancellationToken>())
            .Returns(0);
        _vehicleRepository.GetVehicleDataGroupedByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (int Count, List<Continent> Continents)>());
        _supplierRepository.GetTransportSupplierAddressByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (string? Address, Continent? PrimaryContinent)>());

        var query = new TpQry.GetTransportProvidersQuery(1, 10, null, "Inactive");

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        Assert.Equal(UserStatus.Inactive, result.Value.Items[0].Status);
    }

    [Fact]
    public async Task Handle_CombinesSearchAndStatus()
    {
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            FullName = "Active Taxi",
            Email = "active@example.com",
            Status = UserStatus.Active
        };
        _userRepository.FindProvidersByRoleAsync(6, "taxi", "Active", 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity> { user });
        _userRepository.CountProvidersByRoleAsync(6, "taxi", "Active", Arg.Any<CancellationToken>())
            .Returns(1);
        _userRepository.CountProvidersByRoleAsync(6, "taxi", "Pending", Arg.Any<CancellationToken>())
            .Returns(0);
        _vehicleRepository.GetVehicleDataGroupedByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (int Count, List<Continent> Continents)>());
        _supplierRepository.GetTransportSupplierAddressByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (string? Address, Continent? PrimaryContinent)>());

        var query = new TpQry.GetTransportProvidersQuery(1, 10, "taxi", "Active");

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        await _userRepository.Received(1).FindProvidersByRoleAsync(6, "taxi", "Active", 1, 10, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithPagination_AppliesPageSize()
    {
        _userRepository.FindProvidersByRoleAsync(6, null, null, 2, 20, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity>());
        _userRepository.CountProvidersByRoleAsync(6, null, null, Arg.Any<CancellationToken>())
            .Returns(0);
        _userRepository.CountProvidersByRoleAsync(6, null, "Pending", Arg.Any<CancellationToken>())
            .Returns(0);
        _vehicleRepository.GetVehicleDataGroupedByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (int Count, List<Continent> Continents)>());
        _supplierRepository.GetTransportSupplierAddressByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (string? Address, Continent? PrimaryContinent)>());

        var query = new TpQry.GetTransportProvidersQuery(2, 20, null, null);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.PageNumber);
        Assert.Equal(20, result.Value.PageSize);
        await _userRepository.Received(1).FindProvidersByRoleAsync(6, null, null, 2, 20, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_InvalidPageNumber_NormalizesToOne()
    {
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            FullName = "Taxi",
            Email = "taxi@example.com",
            Status = UserStatus.Active
        };
        _userRepository.FindProvidersByRoleAsync(6, null, null, 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity> { user });
        _userRepository.CountProvidersByRoleAsync(6, null, null, Arg.Any<CancellationToken>())
            .Returns(1);
        _userRepository.CountProvidersByRoleAsync(6, null, "Pending", Arg.Any<CancellationToken>())
            .Returns(0);
        _vehicleRepository.GetVehicleDataGroupedByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (int Count, List<Continent> Continents)>());
        _supplierRepository.GetTransportSupplierAddressByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, (string? Address, Continent? PrimaryContinent)>());

        var query = new TpQry.GetTransportProvidersQuery(-5, -1, null, null);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        await _userRepository.Received(1).FindProvidersByRoleAsync(6, null, null, 1, 10, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithContinent_FiltersByContinent()
    {
        // Arrange
        var continent = Continent.Asia;
        var userIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() };
        var users = new List<UserEntity>
        {
            new UserEntity
            {
                Id = userIds[0],
                FullName = "Provider A",
                Email = "a@test.com",
                Status = UserStatus.Active
            },
            new UserEntity
            {
                Id = userIds[1],
                FullName = "Provider B",
                Email = "b@test.com",
                Status = UserStatus.Active
            }
        };
        var vehicleData = new Dictionary<Guid, (int Count, List<Continent> Continents)>
        {
            [userIds[0]] = (2, new List<Continent> { Continent.Asia }),
            [userIds[1]] = (1, new List<Continent> { Continent.Asia })
        };
        var supplierAddressData = new Dictionary<Guid, (string? Address, Continent? PrimaryContinent)>();

        var query = new TpQry.GetTransportProvidersQuery
        {
            Continent = continent
        };

        _supplierRepository.FindOwnerUserIdsByTransportProviderContinentsAsync(Arg.Is<List<Continent>>(l => l.Contains(continent)), Arg.Any<CancellationToken>())
            .Returns(userIds);
        _userRepository.FindProvidersByRoleWithIdsAsync(6, null, null, Arg.Any<List<Guid>>(), 1, 10, Arg.Any<CancellationToken>())
            .Returns(users);
        _userRepository.CountProvidersByRoleWithIdsAsync(6, null, null, Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(2);
        _userRepository.CountProvidersByRoleAsync(6, null, "Pending", Arg.Any<CancellationToken>())
            .Returns(0);
        _vehicleRepository.GetVehicleDataGroupedByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(vehicleData);
        _supplierRepository.GetTransportSupplierAddressByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(supplierAddressData);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.Total);
        Assert.Equal(2, result.Value.Items.Count);
        await _supplierRepository.Received(1).FindOwnerUserIdsByTransportProviderContinentsAsync(Arg.Is<List<Continent>>(l => l.Contains(continent)), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithContinent_PendingCountRespectsFilter()
    {
        // Arrange
        var continent = Continent.Asia;
        var userIds = new List<Guid> { Guid.NewGuid() };
        var users = new List<UserEntity>
        {
            new UserEntity
            {
                Id = userIds[0],
                FullName = "Pending Provider",
                Email = "pending@test.com",
                Status = UserStatus.Inactive
            }
        };
        var vehicleData = new Dictionary<Guid, (int Count, List<Continent> Continents)>
        {
            [userIds[0]] = (1, new List<Continent> { Continent.Asia })
        };
        var supplierAddressData = new Dictionary<Guid, (string? Address, Continent? PrimaryContinent)>();

        var query = new TpQry.GetTransportProvidersQuery
        {
            Continent = continent
        };

        _supplierRepository.FindOwnerUserIdsByTransportProviderContinentsAsync(Arg.Is<List<Continent>>(l => l.Contains(continent)), Arg.Any<CancellationToken>())
            .Returns(userIds);
        _userRepository.FindProvidersByRoleWithIdsAsync(6, null, null, Arg.Any<List<Guid>>(), 1, 10, Arg.Any<CancellationToken>())
            .Returns(users);
        _userRepository.CountProvidersByRoleWithIdsAsync(6, null, null, Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(1);
        _userRepository.CountProvidersByRoleAsync(6, null, "Pending", Arg.Any<CancellationToken>())
            .Returns(1);
        _vehicleRepository.GetVehicleDataGroupedByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(vehicleData);
        _supplierRepository.GetTransportSupplierAddressByOwnerAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(supplierAddressData);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert: verify pending count method was called
        await _userRepository.Received(1).CountProvidersByRoleAsync(6, null, "Pending", Arg.Any<CancellationToken>());
    }
}
