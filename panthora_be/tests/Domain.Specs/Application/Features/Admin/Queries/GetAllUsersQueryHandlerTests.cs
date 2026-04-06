using Application.Features.Admin.DTOs;
using Application.Features.Admin.Queries.GetAllUsers;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using global::Contracts;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.Admin.Queries;

public sealed class GetAllUsersQueryHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly GetAllUsersQueryHandler _handler;

    public GetAllUsersQueryHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _roleRepository = Substitute.For<IRoleRepository>();
        _handler = new GetAllUsersQueryHandler(_userRepository, _roleRepository);
    }

    [Fact]
    public async Task Handle_ValidRequest_ReturnsPaginatedUserList()
    {
        var userId = Guid.NewGuid();
        var users = new List<UserEntity>
        {
            new()
            {
                Id = userId,
                Username = "manager1",
                Email = "manager1@example.com",
                PhoneNumber = "+84 123 456 001",
                FullName = "Manager One",
                AvatarUrl = "https://example.com/avatar1.jpg",
                Status = UserStatus.Active,
                VerifyStatus = VerifyStatus.Verified,
                IsDeleted = false
            }
        };
        _userRepository.FindAll(null, (int?)null, 1, 20).Returns(users);
        _userRepository.CountAll(null, (int?)null).Returns(1);
        _roleRepository.FindByUserIds(Arg.Any<List<Guid>>()).Returns(
            new Dictionary<Guid, List<RoleEntity>>
            {
                { userId, new List<RoleEntity> { new() { Id = 1, Name = "Manager" } } }
            });

        var query = new GetAllUsersQuery(1, 20, null, null, null);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.NotNull(result.Value);
        Assert.Single(result.Value.Items);
        Assert.Equal(1, result.Value.Total);
        Assert.Equal(userId, result.Value.Items[0].Id);
        Assert.Equal("Manager One", result.Value.Items[0].FullName);
        Assert.Equal("Manager", result.Value.Items[0].Role);
    }

    [Fact]
    public async Task Handle_WithRoleFilter_ReturnsFilteredUsers()
    {
        var userId = Guid.NewGuid();
        var roleId = 2;
        var users = new List<UserEntity>
        {
            new()
            {
                Id = userId,
                Username = "guide1",
                Email = "guide1@example.com",
                FullName = "Tour Guide One",
                Status = UserStatus.Active,
                VerifyStatus = VerifyStatus.Verified,
                IsDeleted = false
            }
        };
        _roleRepository.FindByNameAsync("TourGuide")
            .Returns(new RoleEntity { Id = roleId, Name = "TourGuide" });
        _userRepository.FindAll(null, (int?)roleId, 1, 20).Returns(users);
        _userRepository.CountAll(null, (int?)roleId).Returns(1);
        _roleRepository.FindByUserIds(Arg.Any<List<Guid>>()).Returns(
            new Dictionary<Guid, List<RoleEntity>>
            {
                { userId, new List<RoleEntity> { new() { Id = roleId, Name = "TourGuide" } } }
            });

        var query = new GetAllUsersQuery(1, 20, null, null, "TourGuide");

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        await _userRepository.Received().FindAll(null, roleId, 1, 20);
        await _userRepository.Received().CountAll(null, roleId);
    }

    [Fact]
    public async Task Handle_WithStatusFilter_ReturnsFilteredUsers()
    {
        var users = new List<UserEntity>();
        _userRepository.FindAll(null, (int?)null, 1, 20).Returns(users);
        _userRepository.CountAll(null, (int?)null).Returns(0);
        _roleRepository.FindByUserIds(Arg.Any<List<Guid>>()).Returns(
            new Dictionary<Guid, List<RoleEntity>>());

        var query = new GetAllUsersQuery(1, 20, null, UserStatus.Active, null);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        await _userRepository.Received().FindAll(null, (int?)null, 1, 20);
    }

    [Fact]
    public async Task Handle_WithSearchText_ReturnsMatchingUsers()
    {
        var userId = Guid.NewGuid();
        var users = new List<UserEntity>
        {
            new()
            {
                Id = userId,
                Username = "lan",
                Email = "lan@example.com",
                FullName = "Lan Nguyen",
                Status = UserStatus.Active,
                VerifyStatus = VerifyStatus.Verified,
                IsDeleted = false
            }
        };
        _userRepository.FindAll("Lan", (int?)null, 1, 20).Returns(users);
        _userRepository.CountAll("Lan", (int?)null).Returns(1);
        _roleRepository.FindByUserIds(Arg.Any<List<Guid>>()).Returns(
            new Dictionary<Guid, List<RoleEntity>>
            {
                { userId, new List<RoleEntity> { new() { Id = 3, Name = "TourGuide" } } }
            });

        var query = new GetAllUsersQuery(1, 20, "Lan", null, null);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Contains("Lan", result.Value.Items[0].FullName);
    }

    [Fact]
    public async Task Handle_NoResults_ReturnsEmptyPaginatedResult()
    {
        _userRepository.FindAll(
            Arg.Any<string?>(), Arg.Any<int?>(), Arg.Any<int>(), Arg.Any<int>())
            .Returns(new List<UserEntity>());
        _userRepository.CountAll(Arg.Any<string?>(), Arg.Any<int?>()).Returns(0);
        _roleRepository.FindByUserIds(Arg.Any<List<Guid>>()).Returns(
            new Dictionary<Guid, List<RoleEntity>>());

        var query = new GetAllUsersQuery(1, 20, null, null, null);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Empty(result.Value.Items);
        Assert.Equal(0, result.Value.Total);
    }

    [Fact]
    public async Task Handle_InvalidRole_ReturnsEmptyResult()
    {
        _roleRepository.FindByNameAsync("InvalidRole")
            .Returns((RoleEntity?)null);
        _userRepository.CountByRolesAsync(null, Arg.Any<CancellationToken>())
            .Returns(new Dictionary<string, int> { { "Manager", 5 }, { "TourGuide", 3 } });

        var query = new GetAllUsersQuery(1, 20, null, null, "InvalidRole");

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Empty(result.Value.Items);
        Assert.Equal(0, result.Value.Total);
        await _userRepository.Received().CountByRolesAsync(null, Arg.Any<CancellationToken>());
    }
}
