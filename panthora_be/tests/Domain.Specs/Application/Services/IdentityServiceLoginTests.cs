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
        _tokenManager.GenerateToken(user)
            .Returns(Error.Failure("Identity.TokenGenerationFailed", "Token manager unavailable"));

        var service = CreateService();

        var result = await service.Login(new LoginRequest("admin@example.com", "secret123"));

        Assert.True(result.IsError);
        Assert.Equal("Identity.ServiceUnavailable", result.FirstError.Code);
    }
}
