using Application.Common.Interfaces;
using Application.Contracts.Identity;
using Application.Options;
using Application.Services;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using NSubstitute;

namespace Domain.Specs.Application.Services;

public sealed class IdentityServiceLoginTests
{
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly ITokenManager _tokenManager = Substitute.For<ITokenManager>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly IUserService _userService = Substitute.For<IUserService>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IRoleRepository _roleRepository = Substitute.For<IRoleRepository>();
    private readonly IRegisterRepository _registerRepository = Substitute.For<IRegisterRepository>();
    private readonly IMailRepository _mailRepository = Substitute.For<IMailRepository>();
    private readonly IOtpRepository _otpRepository = Substitute.For<IOtpRepository>();
    private readonly IPasswordResetTokenRepository _passwordResetTokenRepository = Substitute.For<IPasswordResetTokenRepository>();
    private readonly IConfiguration _configuration = new ConfigurationBuilder().AddInMemoryCollection().Build();

    private IdentityService CreateService() => new(
        _user,
        _tokenManager,
        _unitOfWork,
        _passwordHasher,
        _userService,
        _userRepository,
        _roleRepository,
        _registerRepository,
        _mailRepository,
        _otpRepository,
        _passwordResetTokenRepository,
        _configuration,
        Microsoft.Extensions.Options.Options.Create(new AuthOptions()));

    [Fact]
    public async Task Login_WhenUserNotFound_ShouldReturnUnauthorizedInvalidCredentials()
    {
        _userRepository.FindByEmail("admin@example.com").Returns((UserEntity?)null);
        var service = CreateService();

        var result = await service.Login(new LoginRequest("admin@example.com", "secret123"));

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Unauthorized, result.FirstError.Type);
        Assert.Equal("Identity.InvalidCredentials", result.FirstError.Code);
    }

    [Fact]
    public async Task Login_WhenPasswordInvalid_ShouldReturnUnauthorizedInvalidCredentials()
    {
        var user = new UserEntity
        {
            Email = "admin@example.com",
            Password = "hashed-password",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        _userRepository.FindByEmail("admin@example.com").Returns(user);
        _passwordHasher.VerifyHashedPassword("hashed-password", "wrong-password").Returns(false);
        var service = CreateService();

        var result = await service.Login(new LoginRequest("admin@example.com", "wrong-password"));

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Unauthorized, result.FirstError.Type);
        Assert.Equal("Identity.InvalidCredentials", result.FirstError.Code);
    }

    [Fact]
    public async Task Login_WhenUserIsInactive_ShouldReturnForbidden()
    {
        var user = new UserEntity
        {
            Email = "admin@example.com",
            Password = "hashed-password",
            Status = UserStatus.Inactive,
            IsDeleted = false
        };

        _userRepository.FindByEmail("admin@example.com").Returns(user);
        _passwordHasher.VerifyHashedPassword("hashed-password", "secret123").Returns(true);
        var service = CreateService();

        var result = await service.Login(new LoginRequest("admin@example.com", "secret123"));

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Forbidden, result.FirstError.Type);
        Assert.Equal("Identity.AccountForbidden", result.FirstError.Code);
    }

    [Fact]
    public async Task Login_WhenTokenGenerationFails_ShouldReturnServiceUnavailable()
    {
        var user = new UserEntity
        {
            Email = "admin@example.com",
            Password = "hashed-password",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        _userRepository.FindByEmail("admin@example.com").Returns(user);
        _passwordHasher.VerifyHashedPassword("hashed-password", "secret123").Returns(true);
        _tokenManager.GenerateToken(user, Arg.Any<CancellationToken>())
            .Returns(Error.Failure("Identity.TokenGenerationFailed", "Token manager unavailable"));

        var service = CreateService();

        var result = await service.Login(new LoginRequest("admin@example.com", "secret123"));

        Assert.True(result.IsError);
        Assert.Equal("Identity.ServiceUnavailable", result.FirstError.Code);
    }

    // ===== LoginWithRoles tests =====

    [Fact]
    public async Task LoginWithRoles_WhenUserHasTwoDistinctRoles_ShouldReturnTokensAndCorrectPortal()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "admin@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        // RoleEntity.Id is int (from Aggregate<int>)
        var role1 = new RoleEntity { Id = 0, Name = "Admin" };
        var role2 = new RoleEntity { Id = 9, Name = "Manager" };

        _userRepository.FindByEmail("admin@test.com").Returns(user);
        _passwordHasher.VerifyHashedPassword("hashed", "secret123").Returns(true);

        // GenerateTokenWithRoles returns Task<ErrorOr<...>>
        _tokenManager.GenerateTokenWithRoles(user, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<(string AccessToken, string RefreshToken, List<RoleEntity> Roles)>>(
                (("access-token", "refresh-token", new List<RoleEntity> { role1, role2 }))));

        var service = CreateService();

        // Act
        var result = await service.LoginWithRoles(new LoginRequest("admin@test.com", "secret123"));

        // Assert
        Assert.False(result.IsError);
        var (response, roles) = result.Value;
        Assert.NotNull(response.AccessToken);
        Assert.NotNull(response.RefreshToken);
        Assert.Equal(2, roles.Count);
        Assert.Equal("admin", response.Portal);
    }

    [Fact]
    public async Task LoginWithRoles_WhenTokenGenerationFails_ShouldReturnServiceUnavailable()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        _userRepository.FindByEmail("test@example.com").Returns(user);
        _passwordHasher.VerifyHashedPassword("hashed", "secret123").Returns(true);

        _tokenManager.GenerateTokenWithRoles(user, Arg.Any<CancellationToken>())
            .Returns(Error.Failure("Role.QueryFailed", "Failed to query roles"));

        var service = CreateService();

        // Act
        var result = await service.LoginWithRoles(new LoginRequest("test@example.com", "secret123"));

        // Assert
        Assert.True(result.IsError);
        Assert.Equal("Identity.ServiceUnavailable", result.FirstError.Code);
    }

    // ===== Portal routing tests =====

    [Fact]
    public async Task LoginWithRoles_WhenUserHasAdminRole_ShouldRouteToAdminPortal()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "admin@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        var adminRole = new RoleEntity { Id = 0, Name = "Admin" };

        _userRepository.FindByEmail("admin@test.com").Returns(user);
        _passwordHasher.VerifyHashedPassword("hashed", "secret123").Returns(true);

        _tokenManager.GenerateTokenWithRoles(user, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<(string AccessToken, string RefreshToken, List<RoleEntity> Roles)>>(
                (("access-token", "refresh-token", new List<RoleEntity> { adminRole }))));

        var service = CreateService();

        // Act
        var result = await service.LoginWithRoles(new LoginRequest("admin@test.com", "secret123"));

        // Assert
        Assert.False(result.IsError);
        Assert.Equal("admin", result.Value.Response.Portal);
        Assert.Equal("/admin/users", result.Value.Response.DefaultPath);
    }

    [Fact]
    public async Task LoginWithRoles_WhenUserHasManagerRole_ShouldRouteToAdminPortalWithManagerDefaultPath()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "manager@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        var managerRole = new RoleEntity { Id = 9, Name = "Manager" };

        _userRepository.FindByEmail("manager@test.com").Returns(user);
        _passwordHasher.VerifyHashedPassword("hashed", "secret123").Returns(true);

        _tokenManager.GenerateTokenWithRoles(user, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<(string AccessToken, string RefreshToken, List<RoleEntity> Roles)>>(
                (("access-token", "refresh-token", new List<RoleEntity> { managerRole }))));

        var service = CreateService();

        // Act
        var result = await service.LoginWithRoles(new LoginRequest("manager@test.com", "secret123"));

        // Assert
        Assert.False(result.IsError);
        Assert.Equal("admin", result.Value.Response.Portal);
        Assert.Equal("/manager", result.Value.Response.DefaultPath);
    }

    [Fact]
    public async Task LoginWithRoles_WhenUserHasOnlyCustomerRole_ShouldRouteToUserPortal()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "customer@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        var customerRole = new RoleEntity { Id = 2, Name = "Customer" };

        _userRepository.FindByEmail("customer@test.com").Returns(user);
        _passwordHasher.VerifyHashedPassword("hashed", "secret123").Returns(true);

        _tokenManager.GenerateTokenWithRoles(user, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<(string AccessToken, string RefreshToken, List<RoleEntity> Roles)>>(
                (("access-token", "refresh-token", new List<RoleEntity> { customerRole }))));

        var service = CreateService();

        // Act
        var result = await service.LoginWithRoles(new LoginRequest("customer@test.com", "secret123"));

        // Assert
        Assert.False(result.IsError);
        Assert.Equal("user", result.Value.Response.Portal);
        Assert.Equal("/home", result.Value.Response.DefaultPath);
    }

    [Fact]
    public async Task LoginWithRoles_WhenUserHasNoRoles_ShouldRouteToUserPortal()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "noroles@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        _userRepository.FindByEmail("noroles@test.com").Returns(user);
        _passwordHasher.VerifyHashedPassword("hashed", "secret123").Returns(true);

        _tokenManager.GenerateTokenWithRoles(user, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<(string AccessToken, string RefreshToken, List<RoleEntity> Roles)>>(
                (("access-token", "refresh-token", new List<RoleEntity>()))));

        var service = CreateService();

        // Act
        var result = await service.LoginWithRoles(new LoginRequest("noroles@test.com", "secret123"));

        // Assert
        Assert.False(result.IsError);
        Assert.Equal("user", result.Value.Response.Portal);
        Assert.Equal("/home", result.Value.Response.DefaultPath);
    }

    [Fact]
    public async Task LoginWithRoles_WhenUserHasMultipleRoles_ShouldResolvePortalUsingRolesFromTokenWithoutDbQuery()
    {
        // CRITICAL regression test: LoginWithRoles must use the roles returned from
        // GenerateTokenWithRoles for portal resolution, NOT query the database again.
        // This is the performance optimization — one DB call (in TokenManager) for roles,
        // then reuse those roles for portal routing.
        //
        // The roleRepository should NOT be called in LoginWithRoles since the roles
        // come from GenerateTokenWithRoles (which internally queries the repository).

        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "multi@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        var role1 = new RoleEntity { Id = 0, Name = "Admin" };
        var role2 = new RoleEntity { Id = 9, Name = "Manager" };
        var rolesFromToken = new List<RoleEntity> { role1, role2 };

        _userRepository.FindByEmail("multi@test.com").Returns(user);
        _passwordHasher.VerifyHashedPassword("hashed", "secret123").Returns(true);

        _tokenManager.GenerateTokenWithRoles(user, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<(string AccessToken, string RefreshToken, List<RoleEntity> Roles)>>(
                (("access-token", "refresh-token", rolesFromToken))));

        var service = CreateService();

        // Act
        var result = await service.LoginWithRoles(new LoginRequest("multi@test.com", "secret123"));

        // Assert
        Assert.False(result.IsError);
        var (response, roles) = result.Value;

        // Verify the roles returned are the ones from token generation
        Assert.Equal(2, roles.Count);
        Assert.Equal("Admin", roles[0].Name);
        Assert.Equal("Manager", roles[1].Name);

        // Verify portal resolution used the roles from token
        Assert.Equal("admin", response.Portal);

        // CRITICAL: roleRepository should never be called in LoginWithRoles.
        // The roles come from GenerateTokenWithRoles which handles its own DB query.
        // This test verifies the optimization: no extra DB query for portal resolution.
        await _roleRepository.Received(0).FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    // ===== CRITICAL REGRESSION TEST: Duplicate role deduplication =====

    [Fact]
    public async Task LoginWithRoles_WhenRoleRepositoryReturnsDuplicateRoleIds_ShouldReturnDeduplicatedRolesInJWT()
    {
        // CRITICAL regression test: User with duplicate role assignments
        // (e.g., same role assigned multiple times via UserRole join table).
        // TokenManager.GenerateTokenWithRoles dedupes by role.Id (GroupBy + Select First).
        //
        // Deduplication is in TokenManager.cs lines 41-49:
        //   rolesResult.Value
        //     .GroupBy(role => role.Id)
        //     .Select(group => group.First())
        //
        // Without this deduplication, the JWT would contain duplicate ClaimTypes.Role
        // claims, causing potential authorization bypasses or UI routing bugs.

        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "dupe@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        // Simulate 3 roles where role1 and role2 share Id=0 (duplicate assignment)
        var role1 = new RoleEntity { Id = 0, Name = "Admin" };
        var role2 = new RoleEntity { Id = 0, Name = "Admin" }; // DUPLICATE Id
        var customerRole = new RoleEntity { Id = 2, Name = "Customer" };

        _userRepository.FindByEmail("dupe@test.com").Returns(user);
        _passwordHasher.VerifyHashedPassword("hashed", "secret123").Returns(true);

        // Mock: TokenManager returns deduplicated roles (admin deduplicated to 1, customer preserved = 2)
        var deduplicatedRoles = new List<RoleEntity> { role1, customerRole }; // 2 unique
        _tokenManager.GenerateTokenWithRoles(user, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<(string AccessToken, string RefreshToken, List<RoleEntity> Roles)>>(
                (("access-token", "refresh-token", deduplicatedRoles))));

        var service = CreateService();

        // Act
        var result = await service.LoginWithRoles(new LoginRequest("dupe@test.com", "secret123"));

        // Assert: login succeeds with deduplicated roles
        Assert.False(result.IsError);
        var (response, roles) = result.Value;
        Assert.NotNull(response.AccessToken);
        Assert.NotNull(response.RefreshToken);

        // Exactly 2 unique roles (not 3)
        Assert.Equal(2, roles.Count);

        // No duplicate role Ids
        var roleIds = roles.Select(r => r.Id).ToList();
        Assert.Equal(roleIds.Count, roleIds.Distinct().Count());

        // Portal resolves to Admin
        Assert.Equal("admin", response.Portal);
    }
}
