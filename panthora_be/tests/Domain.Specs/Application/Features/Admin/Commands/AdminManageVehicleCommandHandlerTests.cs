namespace Domain.Specs.Application.Features.Admin.Commands;

using global::Application.Features.Admin.Commands.ManageTransportVehicles;
using global::Application.Features.TransportProvider.Vehicles.DTOs;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

public sealed class AdminManageVehicleCommandHandlerTests
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IUserRepository _userRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AdminCreateVehicleCommandHandler> _createLogger;
    private readonly ILogger<AdminUpdateVehicleCommandHandler> _updateLogger;
    private readonly ILogger<AdminDeleteVehicleCommandHandler> _deleteLogger;

    public AdminManageVehicleCommandHandlerTests()
    {
        _vehicleRepository = Substitute.For<IVehicleRepository>();
        _userRepository = Substitute.For<IUserRepository>();
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _unitOfWork = Substitute.For<IUnitOfWork>();
        _createLogger = Substitute.For<ILogger<AdminCreateVehicleCommandHandler>>();
        _updateLogger = Substitute.For<ILogger<AdminUpdateVehicleCommandHandler>>();
        _deleteLogger = Substitute.For<ILogger<AdminDeleteVehicleCommandHandler>>();
    }

    [Fact]
    public async Task Create_ValidRequest_CreatesVehicle()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var providerId = Guid.NewGuid();
        var request = new CreateVehicleRequestDto("51A-12345", (int)VehicleType.Bus, "Ford", "Transit", 16, (int)Continent.Asia, "VN", [], "Note");

        var user = new UserEntity { Id = providerId, IsDeleted = false };
        _userRepository.FindById(providerId, Arg.Any<CancellationToken>()).Returns(user);
        _userRepository.FindTransportProviderByIdAsync(providerId, Arg.Any<CancellationToken>()).Returns(user);
        _supplierRepository.FindAllTransportProvidersAsync(Arg.Any<CancellationToken>()).Returns([new SupplierEntity { OwnerUserId = providerId }]);
        _vehicleRepository.FindByPlateAndOwnerIdAsync("51A-12345", providerId, Arg.Any<CancellationToken>()).Returns((VehicleEntity?)null);

        var handler = new AdminCreateVehicleCommandHandler(_vehicleRepository, _userRepository, _supplierRepository, _unitOfWork, _createLogger);
        var command = new AdminCreateVehicleCommand(adminId, providerId, request);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        await _vehicleRepository.Received(1).AddAsync(Arg.Is<VehicleEntity>(v =>
            v.VehiclePlate == "51A-12345" &&
            v.OwnerId == providerId &&
            v.CreatedBy == adminId.ToString()));
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Create_InvalidTargetRole_ReturnsError()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var providerId = Guid.NewGuid();
        var request = new CreateVehicleRequestDto("51A-12345", (int)VehicleType.Bus, null, null, 16, null, null, null, null);

        var user = new UserEntity { Id = providerId, IsDeleted = false };
        _userRepository.FindById(providerId, Arg.Any<CancellationToken>()).Returns(user);
        _userRepository.FindTransportProviderByIdAsync(providerId, Arg.Any<CancellationToken>()).Returns((UserEntity?)null);

        var handler = new AdminCreateVehicleCommandHandler(_vehicleRepository, _userRepository, _supplierRepository, _unitOfWork, _createLogger);
        var command = new AdminCreateVehicleCommand(adminId, providerId, request);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal("Admin.InvalidTargetRole", result.FirstError.Code);
    }

    [Fact]
    public async Task Create_PlateCollision_ReturnsConflict()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var providerId = Guid.NewGuid();
        var request = new CreateVehicleRequestDto("51A-12345", (int)VehicleType.Bus, null, null, 16, null, null, null, null);

        var user = new UserEntity { Id = providerId, IsDeleted = false };
        _userRepository.FindById(providerId, Arg.Any<CancellationToken>()).Returns(user);
        _userRepository.FindTransportProviderByIdAsync(providerId, Arg.Any<CancellationToken>()).Returns(user);
        _supplierRepository.FindAllTransportProvidersAsync(Arg.Any<CancellationToken>()).Returns([new SupplierEntity { OwnerUserId = providerId }]);
        _vehicleRepository.FindByPlateAndOwnerIdAsync("51A-12345", providerId, Arg.Any<CancellationToken>()).Returns(new VehicleEntity { VehiclePlate = "51A-12345" });

        var handler = new AdminCreateVehicleCommandHandler(_vehicleRepository, _userRepository, _supplierRepository, _unitOfWork, _createLogger);
        var command = new AdminCreateVehicleCommand(adminId, providerId, request);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal("Admin.VehiclePlateCollision", result.FirstError.Code);
    }

    [Fact]
    public async Task Update_ValidRequest_UpdatesVehicle()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var providerId = Guid.NewGuid();
        var plate = "51A-12345";
        var request = new UpdateVehicleRequestDto((int)VehicleType.Coach, "Mercedes", "Sprinter", 29, (int)Continent.Europe, "DE", [], "Updated note");

        var user = new UserEntity { Id = providerId, IsDeleted = false };
        var vehicle = new VehicleEntity { VehiclePlate = plate, OwnerId = providerId };

        _userRepository.FindById(providerId, Arg.Any<CancellationToken>()).Returns(user);
        _vehicleRepository.FindByPlateAndOwnerIdAsync(plate, providerId, Arg.Any<CancellationToken>()).Returns(vehicle);

        var handler = new AdminUpdateVehicleCommandHandler(_vehicleRepository, _userRepository, _unitOfWork, _updateLogger);
        var command = new AdminUpdateVehicleCommand(adminId, providerId, plate, request);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(VehicleType.Coach, vehicle.VehicleType);
        Assert.Equal("Mercedes", vehicle.Brand);
        Assert.Equal(adminId.ToString(), vehicle.LastModifiedBy);
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_ValidRequest_SoftDeletesVehicle()
    {
        // Arrange
        var adminId = Guid.NewGuid();
        var providerId = Guid.NewGuid();
        var plate = "51A-12345";
        var vehicleId = Guid.NewGuid();

        var user = new UserEntity { Id = providerId, IsDeleted = false };
        var vehicle = new VehicleEntity { Id = vehicleId, VehiclePlate = plate, OwnerId = providerId };

        _userRepository.FindById(providerId, Arg.Any<CancellationToken>()).Returns(user);
        _vehicleRepository.FindByPlateAndOwnerIdAsync(plate, providerId, Arg.Any<CancellationToken>()).Returns(vehicle);

        var handler = new AdminDeleteVehicleCommandHandler(_vehicleRepository, _userRepository, _unitOfWork, _deleteLogger);
        var command = new AdminDeleteVehicleCommand(adminId, providerId, plate);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        await _vehicleRepository.Received(1).SoftDeleteAsync(vehicleId, adminId.ToString(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }
}
