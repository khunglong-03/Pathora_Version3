using Application.Common.Constant;
using Application.Features.User.Commands;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.User.Commands;

public class UpdateUserStatusCommandHandlerTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly ISupplierRepository _supplierRepository = Substitute.For<ISupplierRepository>();
    private readonly IVehicleRepository _vehicleRepository = Substitute.For<IVehicleRepository>();
    private readonly IDriverRepository _driverRepository = Substitute.For<IDriverRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IUser _currentUser = Substitute.For<IUser>();
    private readonly ILogger<UpdateUserStatusCommandHandler> _logger = Substitute.For<ILogger<UpdateUserStatusCommandHandler>>();

    private readonly UpdateUserStatusCommandHandler _sut;

    public UpdateUserStatusCommandHandlerTests()
    {
        _sut = new UpdateUserStatusCommandHandler(
            _userRepository,
            _supplierRepository,
            _vehicleRepository,
            _driverRepository,
            _unitOfWork,
            _currentUser,
            _logger);
    }

    [Fact]
    public async Task Handle_WhenUserIsBanned_ShouldDeactivateAssets()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var username = "admin_user";
        _currentUser.Roles.Returns(new List<string> { RoleConstants.Admin });
        _currentUser.Id.Returns(Guid.NewGuid().ToString());
        _currentUser.Username.Returns(username);

        var user = new UserEntity { Id = userId, Status = UserStatus.Active };
        _userRepository.FindById(userId).Returns(user);

        var command = new UpdateUserStatusCommand(userId, UserStatus.Banned);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(UserStatus.Banned, user.Status);

        await _supplierRepository.Received(1).DeactivateAllByOwnerAsync(userId, username, Arg.Any<CancellationToken>());
        await _vehicleRepository.Received(1).DeactivateAllByOwnerAsync(userId, username, Arg.Any<CancellationToken>());
        await _driverRepository.Received(1).DeactivateAllByOwnerAsync(userId, username, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenUserIsUnbanned_ShouldNotAutoActivateAssets()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var username = "admin_user";
        _currentUser.Roles.Returns(new List<string> { RoleConstants.Admin });
        _currentUser.Id.Returns(Guid.NewGuid().ToString());
        _currentUser.Username.Returns(username);

        var user = new UserEntity { Id = userId, Status = UserStatus.Banned };
        _userRepository.FindById(userId).Returns(user);

        var command = new UpdateUserStatusCommand(userId, UserStatus.Active);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(UserStatus.Active, user.Status);

        await _supplierRepository.DidNotReceive().DeactivateAllByOwnerAsync(Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenCallerIsNotAdmin_ShouldReturnForbidden()
    {
        // Arrange
        _currentUser.Roles.Returns(new List<string> { RoleConstants.Manager }); // Not Admin

        var command = new UpdateUserStatusCommand(Guid.NewGuid(), UserStatus.Banned);

        // Act
        var result = await _sut.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Forbidden, result.FirstError.Type);
    }
}
