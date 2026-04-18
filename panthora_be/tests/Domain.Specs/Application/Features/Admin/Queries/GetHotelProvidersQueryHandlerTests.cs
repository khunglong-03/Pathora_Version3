namespace Domain.Specs.Application.Features.Admin.Queries;

using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using global::Application.Features.Admin.Queries.GetHotelProviders;
using NSubstitute;
using Xunit;

public sealed class GetHotelProvidersQueryHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly GetHotelProvidersQueryHandler _handler;

    public GetHotelProvidersQueryHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _handler = new GetHotelProvidersQueryHandler(_supplierRepository, _userRepository);
    }

    [Fact]
    public async Task Handle_WithoutContinentFilter_MapsPrimaryContinentAndFallbackContinents()
    {
        var ownerUserId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = ownerUserId,
            FullName = "Grand Hotel",
            Email = "hotel@example.com",
            PhoneNumber = "+84 444 555 666",
            AvatarUrl = "https://example.com/hotel.jpg",
            Status = UserStatus.Active,
            CreatedOnUtc = DateTimeOffset.UtcNow.AddDays(-10)
        };

        _userRepository.FindProvidersByRoleAsync(7, null, null, 1, 10, Arg.Any<CancellationToken>())
            .Returns([user]);
        _userRepository.CountProvidersByRoleAsync(7, null, null, Arg.Any<CancellationToken>())
            .Returns(1);
        _supplierRepository.GetHotelProviderAdminDataGroupedByOwnerAsync(
                Arg.Is<List<Guid>>(ids => ids.SequenceEqual(new[] { ownerUserId })),
                Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, HotelProviderAdminData>
            {
                [ownerUserId] = new(
                    supplierId,
                    "SUP-001",
                    "Grand Hotel Supplier",
                    "123 Main St",
                    "+84 444 555 666",
                    "supplier@example.com",
                    user.CreatedOnUtc,
                    Continent.Americas,
                    0,
                    0,
                    [Continent.Americas])
            });

        var result = await _handler.Handle(new GetHotelProvidersQuery(), CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);

        var item = result.Value.Items[0];
        Assert.Equal(ownerUserId, item.Id);
        Assert.Equal("Grand Hotel Supplier", item.SupplierName);
        Assert.Equal("SUP-001", item.SupplierCode);
        Assert.Equal("supplier@example.com", item.Email);
        Assert.Equal("+84 444 555 666", item.PhoneNumber);
        Assert.Equal("123 Main St", item.Address);
        Assert.Equal(UserStatus.Active, item.Status);
        Assert.Equal("Americas", item.PrimaryContinent);
        Assert.Equal(["Americas"], item.Continents);
        Assert.Equal(1, result.Value.Total);
    }

    [Fact]
    public async Task Handle_WithContinentFilter_UsesFilteredUserIdsAndReturnsMappedItems()
    {
        var ownerUserId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = ownerUserId,
            FullName = "Filtered Hotel",
            Email = "filtered@example.com",
            PhoneNumber = "+84 000 111 222",
            Status = UserStatus.Active,
            CreatedOnUtc = DateTimeOffset.UtcNow.AddDays(-5)
        };

        _supplierRepository.FindOwnerUserIdsByHotelProviderContinentsAsync(
                Arg.Is<List<Continent>>(continents => continents.SequenceEqual(new[] { Continent.Americas })),
                Arg.Any<CancellationToken>())
            .Returns([ownerUserId]);
        _userRepository.CountProvidersByRoleWithIdsAsync(
                7,
                null,
                null,
                Arg.Is<List<Guid>>(ids => ids.SequenceEqual(new[] { ownerUserId })),
                Arg.Any<CancellationToken>())
            .Returns(1);
        _userRepository.FindProvidersByRoleWithIdsAsync(
                7,
                null,
                null,
                Arg.Is<List<Guid>>(ids => ids.SequenceEqual(new[] { ownerUserId })),
                1,
                10,
                Arg.Any<CancellationToken>())
            .Returns([user]);
        _supplierRepository.GetHotelProviderAdminDataGroupedByOwnerAsync(
                Arg.Is<List<Guid>>(ids => ids.SequenceEqual(new[] { ownerUserId })),
                Arg.Any<CancellationToken>())
            .Returns(new Dictionary<Guid, HotelProviderAdminData>
            {
                [ownerUserId] = new(
                    supplierId,
                    "SUP-002",
                    "Filtered Hotel Supplier",
                    "456 Ocean Dr",
                    "+84 000 111 222",
                    "filtered-supplier@example.com",
                    user.CreatedOnUtc,
                    Continent.Asia,
                    2,
                    18,
                    [Continent.Europe, Continent.Americas])
            });

        var result = await _handler.Handle(
            new GetHotelProvidersQuery(Continents: [Continent.Americas]),
            CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);

        var item = result.Value.Items[0];
        Assert.Equal("Filtered Hotel Supplier", item.SupplierName);
        Assert.Equal("Asia", item.PrimaryContinent);
        Assert.Equal(["Europe", "Americas"], item.Continents);
        Assert.Equal(2, item.AccommodationCount);
        Assert.Equal(18, item.RoomCount);
    }

    [Fact]
    public async Task Handle_WithContinentFilterAndNoMatches_ReturnsEmptyPage()
    {
        _supplierRepository.FindOwnerUserIdsByHotelProviderContinentsAsync(
                Arg.Any<List<Continent>>(),
                Arg.Any<CancellationToken>())
            .Returns([]);

        var result = await _handler.Handle(
            new GetHotelProvidersQuery(Continents: [Continent.Oceania]),
            CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Empty(result.Value.Items);
        Assert.Equal(0, result.Value.Total);

        await _userRepository.DidNotReceive().FindProvidersByRoleWithIdsAsync(
            Arg.Any<int>(),
            Arg.Any<string?>(),
            Arg.Any<string?>(),
            Arg.Any<List<Guid>>(),
            Arg.Any<int>(),
            Arg.Any<int>(),
            Arg.Any<CancellationToken>());
    }
}
