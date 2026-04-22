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

public sealed class UpdateUserStatusCommandHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IDriverRepository _driverRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUser _currentUser;
    private readonly ILogger<UpdateUserStatusCommandHandler> _logger;
    private readonly UpdateUserStatusCommandHandler _handler;

    public UpdateUserStatusCommandHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _vehicleRepository = Substitute.For<IVehicleRepository>();
        _driverRepository = Substitute.For<IDriverRepository>();
        _unitOfWork = Substitute.For<IUnitOfWork>();
        _currentUser = Substitute.For<IUser>();
        _logger = Substitute.For<ILogger<UpdateUserStatusCommandHandler>>();

        _handler = new UpdateUserStatusCommandHandler(
            _userRepository,
            _supplierRepository,
            _vehicleRepository,
            _driverRepository,
            _unitOfWork,
            _currentUser,
            _logger);

        // Default: current user is admin
        _currentUser.Roles.Returns(["Admin"]);
        _currentUser.Username.Returns("test-admin");
        _currentUser.Id.Returns(Guid.NewGuid().ToString());
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsNotFound()
    {
        // Arrange
        var request = new UpdateUserStatusCommand(Guid.NewGuid(), UserStatus.Inactive);
        _userRepository.FindById(request.UserId, Arg.Any<CancellationToken>())
            .Returns((UserEntity?)null);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
    }

    [Fact]
    public async Task Handle_NonAdmin_ReturnsForbidden()
    {
        // Arrange
        _currentUser.Roles.Returns(["Customer"]);
        var request = new UpdateUserStatusCommand(Guid.NewGuid(), UserStatus.Banned);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Forbidden, result.FirstError.Type);
    }

    [Fact]
    public async Task Handle_BannedStatus_DeactivatesAllAssets()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new UpdateUserStatusCommand(userId, UserStatus.Banned);
        var user = new UserEntity { Id = userId, Status = UserStatus.Active };

        var supplier = new SupplierEntity { OwnerUserId = userId, IsActive = true };
        var vehicle = new VehicleEntity { OwnerId = userId, IsActive = true };
        var driver = new DriverEntity { UserId = userId, IsActive = true };

        _userRepository.FindById(userId, Arg.Any<CancellationToken>()).Returns(user);
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>()).Returns([supplier]);
        _vehicleRepository.FindAllByOwnerIdAsync(userId, Arg.Any<CancellationToken>()).Returns([vehicle]);
        _driverRepository.FindAllByUserIdAsync(userId, Arg.Any<CancellationToken>()).Returns([driver]);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(UserStatus.Banned, user.Status);
        Assert.False(supplier.IsActive);
        Assert.False(vehicle.IsActive);
        Assert.False(driver.IsActive);

        _supplierRepository.Received(1).Update(supplier);
        _vehicleRepository.Received(1).Update(vehicle);
        await _driverRepository.Received(1).UpdateAsync(driver, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }
}
