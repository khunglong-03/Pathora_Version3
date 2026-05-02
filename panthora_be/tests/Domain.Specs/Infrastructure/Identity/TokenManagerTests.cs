using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Contracts.Interfaces;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using ErrorOr;
using global::Infrastructure.Identity;
using Microsoft.Extensions.Options;
using NSubstitute;
using ZiggyCreatures.Caching.Fusion;

namespace Domain.Specs.Infrastructure.Identity;

public sealed class TokenManagerTests
{
    private readonly IOptions<JwtOptions> _jwtOptions;
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IRoleRepository _roleRepository = Substitute.For<IRoleRepository>();
    private readonly IFusionCache _fusionCache = Substitute.For<IFusionCache>();
    private readonly IToken _token = Substitute.For<IToken>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IRepository<RefreshTokenEntity> _refreshTokenRepo = Substitute.For<IRepository<RefreshTokenEntity>>();

    public TokenManagerTests()
    {
        _jwtOptions = Microsoft.Extensions.Options.Options.Create(new JwtOptions
        {
            Secret = "super-secret-key-that-is-at-least-32-characters-long",
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            ExpireInMinutes = 60,
            RefreshTokenExpirationHours = 168
        });

        _unitOfWork.GenericRepository<RefreshTokenEntity>().Returns(_refreshTokenRepo);
    }

    private TokenManager CreateTokenManager() => new(
        _jwtOptions,
        _userRepository,
        _roleRepository,
        _fusionCache,
        _token,
        _unitOfWork);

    // ===== Critical regression test: duplicate role assignments must NOT produce duplicate JWT claims =====

    [Fact]
    public async Task GenerateTokenWithRoles_WhenUserHasDuplicateRoleAssignments_ShouldProduceOnlyOneRoleClaimInJwt()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "dup-roles@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        // RoleEntity.Id is int (from Aggregate<int>)
        var sharedRoleId = 0; // Admin role Id
        var role1 = new RoleEntity { Id = sharedRoleId, Name = "Admin" };
        var role2 = new RoleEntity { Id = sharedRoleId, Name = "Admin" }; // Same Id!
        var role3 = new RoleEntity { Id = 9, Name = "Manager" };

        _roleRepository.FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<List<RoleEntity>>>(new List<RoleEntity> { role1, role2, role3 }));

        var tokenManager = CreateTokenManager();

        // Act
        var result = await tokenManager.GenerateTokenWithRoles(user, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        var (accessToken, _, roles) = result.Value;

        // Verify deduplication at the return level: only 2 roles (Admin + Manager)
        Assert.Equal(2, roles.Count);

        // Decode JWT and verify NO duplicate role claims in the actual token
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(accessToken);

        var roleClaims = jwt.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
        var rolesCustomClaims = jwt.Claims.Where(c => c.Type == "roles").ToList();

        // Critical: exactly 2 role claims (Admin + Manager), not 3
        Assert.Equal(2, roleClaims.Count);
        Assert.Equal(2, rolesCustomClaims.Count);

        // No duplicate values
        var roleClaimValues = roleClaims.Select(c => c.Value).ToList();
        Assert.Equal(roleClaimValues.Count, roleClaimValues.Distinct().Count());
    }

    [Fact]
    public async Task GenerateTokenWithRoles_WhenTwoRolesHaveSameId_ShouldDeduplicateByRoleId()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "dup-same-id@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        // Two RoleEntity objects with the SAME Id but potentially different Names
        // (this can happen if a user is assigned the same role twice via different joins)
        var sharedRoleId = 0;
        var role1 = new RoleEntity { Id = sharedRoleId, Name = "Admin" };
        var role2 = new RoleEntity { Id = sharedRoleId, Name = "Admin" };

        _roleRepository.FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<List<RoleEntity>>>(new List<RoleEntity> { role1, role2 }));

        var tokenManager = CreateTokenManager();

        // Act
        var result = await tokenManager.GenerateTokenWithRoles(user, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        var (accessToken, _, roles) = result.Value;

        // The query returns 2 roles, but deduplication should yield 1
        Assert.Single(roles);
        Assert.Equal("Admin", roles[0].Name);

        // And the JWT should have exactly 1 role claim
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(accessToken);
        var roleClaims = jwt.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
        Assert.Single(roleClaims);
        Assert.Equal("Admin", roleClaims[0].Value);
    }

    [Fact]
    public async Task GenerateTokenWithRoles_WhenThreeRolesHaveSameId_ShouldDeduplicateToOne()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "triple-dup@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        var sharedRoleId = 0;
        var role1 = new RoleEntity { Id = sharedRoleId, Name = "Admin" };
        var role2 = new RoleEntity { Id = sharedRoleId, Name = "Admin" };
        var role3 = new RoleEntity { Id = sharedRoleId, Name = "Admin" };

        _roleRepository.FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<List<RoleEntity>>>(new List<RoleEntity> { role1, role2, role3 }));

        var tokenManager = CreateTokenManager();

        // Act
        var result = await tokenManager.GenerateTokenWithRoles(user, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        var (_, _, roles) = result.Value;

        // 3 identical entries → deduplicated to 1
        Assert.Single(roles);

        // Verify JWT has exactly 1 role claim
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(result.Value.AccessToken);
        var roleClaims = jwt.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
        Assert.Single(roleClaims);
    }

    // ===== Happy path tests =====

    [Fact]
    public async Task GenerateTokenWithRoles_WhenUserHasTwoDistinctRoles_ShouldReturnTokensAndRoles()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "multi-role@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        var role1 = new RoleEntity { Id = 0, Name = "Admin" };
        var role2 = new RoleEntity { Id = 9, Name = "Manager" };

        _roleRepository.FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<List<RoleEntity>>>(new List<RoleEntity> { role1, role2 }));

        var tokenManager = CreateTokenManager();

        // Act
        var result = await tokenManager.GenerateTokenWithRoles(user, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        var (accessToken, refreshToken, roles) = result.Value;
        Assert.NotNull(accessToken);
        Assert.NotNull(refreshToken);
        Assert.Equal(2, roles.Count);
    }

    [Fact]
    public async Task GenerateTokenWithRoles_WhenUserHasNoRoles_ShouldReturnTokensWithEmptyRoles()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "no-roles@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        _roleRepository.FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<List<RoleEntity>>>(new List<RoleEntity>()));

        var tokenManager = CreateTokenManager();

        // Act
        var result = await tokenManager.GenerateTokenWithRoles(user, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        var (accessToken, refreshToken, roles) = result.Value;
        Assert.NotNull(accessToken);
        Assert.NotNull(refreshToken);
        Assert.Empty(roles);

        // JWT should have no role claims
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(accessToken);
        var roleClaims = jwt.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
        Assert.Empty(roleClaims);
    }

    // ===== Error path tests =====

    [Fact]
    public async Task GenerateTokenWithRoles_WhenRoleRepositoryReturnsError_ShouldReturnError()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "role-error@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        _roleRepository.FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<List<RoleEntity>>>(Error.Failure("Role.QueryFailed", "Database error")));

        var tokenManager = CreateTokenManager();

        // Act
        var result = await tokenManager.GenerateTokenWithRoles(user, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal("Role.QueryFailed", result.FirstError.Code);
    }

    [Fact]
    public async Task GenerateTokenWithRoles_WhenUserHasOneRole_ShouldReturnTokenWithOneRoleClaim()
    {
        // Arrange
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            Email = "single-role@test.com",
            Password = "hashed",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        var role = new RoleEntity { Id = 2, Name = "Customer" };

        _roleRepository.FindByUserId(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult<ErrorOr<List<RoleEntity>>>(new List<RoleEntity> { role }));

        var tokenManager = CreateTokenManager();

        // Act
        var result = await tokenManager.GenerateTokenWithRoles(user, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        var (_, _, roles) = result.Value;
        Assert.Single(roles);
        Assert.Equal("Customer", roles[0].Name);

        // JWT should have exactly 1 role claim
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(result.Value.AccessToken);
        var roleClaims = jwt.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
        Assert.Single(roleClaims);
        Assert.Equal("Customer", roleClaims[0].Value);
    }
}
