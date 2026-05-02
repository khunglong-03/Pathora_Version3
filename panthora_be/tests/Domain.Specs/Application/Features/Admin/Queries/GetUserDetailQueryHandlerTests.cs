using global::Application.Features.Admin.DTOs;
using global::Application.Features.Admin.Queries.GetUserDetail;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using ErrorOr;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.Admin.Queries;

public sealed class GetUserDetailQueryHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly GetUserDetailQueryHandler _handler;

    public GetUserDetailQueryHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _roleRepository = Substitute.For<IRoleRepository>();
        _handler = new GetUserDetailQueryHandler(_userRepository, _roleRepository);
    }

    [Fact]
    public async Task Handle_UserExists_ReturnsFullDetailDto()
    {
        var userId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = userId,
            Username = "tourguide1",
            Email = "guide@example.com",
            PhoneNumber = "+84 999 888 777",
            FullName = "Guide One",
            AvatarUrl = "https://example.com/guide.jpg",
            Status = UserStatus.Active,
            VerifyStatus = VerifyStatus.Verified,
            IsDeleted = false
        };
        _userRepository.FindById(userId).Returns(user);
        _roleRepository.FindByUserId(userId.ToString())
            .Returns(new List<RoleEntity> { new() { Id = 3, Name = "TourGuide" } });

        var query = new GetUserDetailQuery(userId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.NotNull(result.Value);
        Assert.Equal(userId, result.Value.Id);
        Assert.Equal("Guide One", result.Value.FullName);
        Assert.Equal("guide@example.com", result.Value.Email);
        Assert.Equal("+84 999 888 777", result.Value.PhoneNumber);
        Assert.Contains("TourGuide", result.Value.Roles);
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsNotFound()
    {
        var userId = Guid.NewGuid();
        _userRepository.FindById(userId).Returns((UserEntity?)null);

        var query = new GetUserDetailQuery(userId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
        Assert.Equal("User.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_MultipleRoles_ReturnsAllRoles()
    {
        var userId = Guid.NewGuid();
        var user = new UserEntity
        {
            Id = userId,
            Username = "multirole1",
            Email = "multi@example.com",
            FullName = "Multi Role User",
            Status = UserStatus.Active,
            VerifyStatus = VerifyStatus.Verified,
            IsDeleted = false
        };
        _userRepository.FindById(userId).Returns(user);
        _roleRepository.FindByUserId(userId.ToString())
            .Returns(new List<RoleEntity>
            {
                new() { Id = 1, Name = "Admin" },
                new() { Id = 2, Name = "Manager" }
            });

        var query = new GetUserDetailQuery(userId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.Roles.Count);
        Assert.Contains("Admin", result.Value.Roles);
        Assert.Contains("Manager", result.Value.Roles);
    }
}
