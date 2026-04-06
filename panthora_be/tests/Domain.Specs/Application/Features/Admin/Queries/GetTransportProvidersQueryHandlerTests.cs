namespace Domain.Specs.Application.Features.Admin.Queries;

using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using NSubstitute;
using global::Contracts;
using TpQry = global::Application.Features.Admin.Queries.GetTransportProviders;
using Xunit;

public sealed class GetTransportProvidersQueryHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly TpQry.GetTransportProvidersQueryHandler _handler;

    public GetTransportProvidersQueryHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _handler = new TpQry.GetTransportProvidersQueryHandler(_userRepository);
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
        Assert.Equal(0, item.BookingCount);
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

        var query = new TpQry.GetTransportProvidersQuery(-5, -1, null, null);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        await _userRepository.Received(1).FindProvidersByRoleAsync(6, null, null, 1, 10, Arg.Any<CancellationToken>());
    }
}
