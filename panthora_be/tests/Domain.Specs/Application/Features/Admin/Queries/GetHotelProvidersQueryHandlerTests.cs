namespace Domain.Specs.Application.Features.Admin.Queries;

using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using global::Contracts;
using HotelProviders = global::Application.Features.Admin.Queries.GetHotelProviders;
using NSubstitute;
using Xunit;

public sealed class GetHotelProvidersQueryHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly HotelProviders.GetHotelProvidersQueryHandler _handler;

    public GetHotelProvidersQueryHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _handler = new HotelProviders.GetHotelProvidersQueryHandler(_userRepository);
    }

    [Fact]
    public async Task Handle_ReturnsHotelProvidersFromUserRepository()
    {
        var providerId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = providerId,
            FullName = "Grand Hotel",
            Email = "hotel@example.com",
            PhoneNumber = "+84 444 555 666",
            AvatarUrl = "https://example.com/hotel.jpg",
            Status = UserStatus.Active
        };
        _userRepository.FindProvidersByRoleAsync(7, null, null, 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity> { user });
        _userRepository.CountProvidersByRoleAsync(7, null, null, Arg.Any<CancellationToken>())
            .Returns(1);

        var query = new HotelProviders.GetHotelProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        var item = result.Value.Items[0];
        Assert.Equal("Grand Hotel", item.FullName);
        Assert.Equal("hotel@example.com", item.Email);
        Assert.Equal("+84 444 555 666", item.PhoneNumber);
        Assert.Equal("https://example.com/hotel.jpg", item.AvatarUrl);
        Assert.Equal(UserStatus.Active, item.Status);
        Assert.Equal(0, item.AccommodationCount);
        Assert.Equal(1, result.Value.Total);
    }

    [Fact]
    public async Task Handle_NoHotelProviders_ReturnsEmptyList()
    {
        _userRepository.FindProvidersByRoleAsync(7, null, null, 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity>());
        _userRepository.CountProvidersByRoleAsync(7, null, null, Arg.Any<CancellationToken>())
            .Returns(0);

        var query = new HotelProviders.GetHotelProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Empty(result.Value.Items);
        Assert.Equal(0, result.Value.Total);
    }

    [Fact]
    public async Task Handle_UserHasInactiveStatus_ReturnsInactiveStatus()
    {
        var providerId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = providerId,
            FullName = "Inactive Hotel",
            Email = "inactive@example.com",
            PhoneNumber = "+84 444 555 666",
            Status = UserStatus.Inactive
        };
        _userRepository.FindProvidersByRoleAsync(7, null, null, 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity> { user });
        _userRepository.CountProvidersByRoleAsync(7, null, null, Arg.Any<CancellationToken>())
            .Returns(1);

        var query = new HotelProviders.GetHotelProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        Assert.Equal(UserStatus.Inactive, result.Value.Items[0].Status);
    }

    [Fact]
    public async Task Handle_MultipleProviders_ReturnsAll()
    {
        var p1 = new UserEntity { Id = Guid.NewGuid(), FullName = "Hotel 1", Email = "h1@example.com", PhoneNumber = "+1", Status = UserStatus.Active };
        var p2 = new UserEntity { Id = Guid.NewGuid(), FullName = "Hotel 2", Email = "h2@example.com", PhoneNumber = "+2", Status = UserStatus.Inactive };
        _userRepository.FindProvidersByRoleAsync(7, null, null, 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity> { p1, p2 });
        _userRepository.CountProvidersByRoleAsync(7, null, null, Arg.Any<CancellationToken>())
            .Returns(2);

        var query = new HotelProviders.GetHotelProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.Items.Count);
        Assert.Equal(2, result.Value.Total);
    }

    [Fact]
    public async Task Handle_WithSearch_FiltersResults()
    {
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            FullName = "Seaside Resort",
            Email = "hotel@example.com",
            Status = UserStatus.Active
        };
        _userRepository.FindProvidersByRoleAsync(7, "sea", null, 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity> { user });
        _userRepository.CountProvidersByRoleAsync(7, "sea", null, Arg.Any<CancellationToken>())
            .Returns(1);

        var query = new HotelProviders.GetHotelProvidersQuery(1, 10, "sea", null);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        await _userRepository.Received(1).FindProvidersByRoleAsync(7, "sea", null, 1, 10, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CombinesSearchAndStatus()
    {
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            FullName = "Active Resort",
            Email = "active@example.com",
            Status = UserStatus.Active
        };
        _userRepository.FindProvidersByRoleAsync(7, "resort", "Active", 1, 10, Arg.Any<CancellationToken>())
            .Returns(new List<UserEntity> { user });
        _userRepository.CountProvidersByRoleAsync(7, "resort", "Active", Arg.Any<CancellationToken>())
            .Returns(1);

        var query = new HotelProviders.GetHotelProvidersQuery(1, 10, "resort", "Active");

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        await _userRepository.Received(1).FindProvidersByRoleAsync(7, "resort", "Active", 1, 10, Arg.Any<CancellationToken>());
    }
}
