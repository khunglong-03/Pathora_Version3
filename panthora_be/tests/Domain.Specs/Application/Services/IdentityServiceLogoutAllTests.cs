using global::Application.Common.Constant;
using global::Application.Common.Interfaces;
using global::Application.Options;
using global::Application.Services;
using Contracts.Interfaces;
using global::Domain.Common.Repositories;
using global::Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Configuration;
using NSubstitute;

namespace Domain.Specs.Application.Services;

public sealed class IdentityServiceLogoutAllTests
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
    public async Task LogoutAll_WhenUserIdNotAvailable_ShouldReturnUnauthorized()
    {
        _user.Id.Returns((string?)null);
        var service = CreateService();

        var result = await service.LogoutAll();

        Assert.True(result.IsError);
        Assert.Equal(ErrorConstants.User.UnauthorizedCode, result.Errors[0].Code);
    }

    [Fact]
    public async Task LogoutAll_WhenUserIdAvailable_ShouldDelegateToTokenManager()
    {
        var userId = Guid.NewGuid().ToString();
        _user.Id.Returns(userId);
        _tokenManager.RevokeAllTokens(userId).Returns(Result.Success);

        var service = CreateService();

        var result = await service.LogoutAll();

        Assert.False(result.IsError);
        await _tokenManager.Received(1).RevokeAllTokens(userId);
    }

    [Fact]
    public async Task LogoutAll_WhenTokenManagerFails_ShouldPropagateError()
    {
        var userId = Guid.NewGuid().ToString();
        _user.Id.Returns(userId);
        var error = Error.Failure("Token.RevokeFailed", "Failed to revoke tokens");
        _tokenManager.RevokeAllTokens(userId).Returns(error);

        var service = CreateService();

        var result = await service.LogoutAll();

        Assert.True(result.IsError);
        Assert.Equal("Token.RevokeFailed", result.Errors[0].Code);
    }
}
