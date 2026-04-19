#pragma warning disable CS4014
using Application.Common.Constant;
using Application.Dtos;
using Application.Features.TourInstance.Commands;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using NSubstitute;

namespace Domain.Specs.Application.Features.TourInstance.Commands;

public class AssignVehicleToRouteCommandHandlerTests
{
    private readonly ITourInstancePlanRouteRepository _mockRouteRepository;
    private readonly IVehicleRepository _mockVehicleRepository;
    private readonly IDriverRepository _mockDriverRepository;
    private readonly ISupplierRepository _mockSupplierRepository;
    private readonly IUser _mockUser;
    private readonly AssignVehicleToRouteCommandHandler _handler;

    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _supplierId = Guid.NewGuid();
    private readonly Guid _instanceId = Guid.NewGuid();
    private readonly Guid _routeId = Guid.NewGuid();
    private readonly Guid _vehicleId = Guid.NewGuid();
    private readonly Guid _driverId = Guid.NewGuid();

    public AssignVehicleToRouteCommandHandlerTests()
    {
        _mockRouteRepository = Substitute.For<ITourInstancePlanRouteRepository>();
        _mockVehicleRepository = Substitute.For<IVehicleRepository>();
        _mockDriverRepository = Substitute.For<IDriverRepository>();
        _mockSupplierRepository = Substitute.For<ISupplierRepository>();
        _mockUser = Substitute.For<IUser>();

        _mockUser.Id.Returns(_userId.ToString());

        // Default Mock Supplier
        _mockSupplierRepository.FindByOwnerUserIdAsync(_userId, Arg.Any<CancellationToken>())
            .Returns(new SupplierEntity { Id = _supplierId, OwnerUserId = _userId });

        _handler = new AssignVehicleToRouteCommandHandler(
            _mockRouteRepository,
            _mockVehicleRepository,
            _mockDriverRepository,
            _mockSupplierRepository,
            _mockUser);
    }

    private TourInstancePlanRouteEntity CreateMockRoute(int maxParticipation, Guid transportProviderId, Guid expectedInstanceId)
    {
        var instance = new TourInstanceEntity { Id = expectedInstanceId, MaxParticipation = maxParticipation, TransportProviderId = transportProviderId };
        var day = new TourInstanceDayEntity { TourInstanceId = expectedInstanceId, TourInstance = instance };
        var activity = new TourInstanceDayActivityEntity { TourInstanceDayId = day.Id, TourInstanceDay = day };
        return new TourInstancePlanRouteEntity { Id = _routeId, TourInstanceDayActivityId = activity.Id, TourInstanceDayActivity = activity };
    }

    [Fact]
    public async Task Handle_WithValidRequest_ReturnsSuccessAndNoWarning()
    {
        var request = new AssignVehicleToRouteCommand(_instanceId, _routeId, _vehicleId, _driverId);

        var route = CreateMockRoute(maxParticipation: 10, transportProviderId: _supplierId, expectedInstanceId: _instanceId);
        _mockRouteRepository.GetDetailsByIdTrackingAsync(_routeId, Arg.Any<CancellationToken>())
            .Returns(route);

        var vehicle = new VehicleEntity { Id = _vehicleId, SeatCapacity = 15, IsActive = true, OwnerId = _userId };
        _mockVehicleRepository.GetByIdAsync(_vehicleId, Arg.Any<CancellationToken>())
            .Returns(vehicle);

        var driver = new DriverEntity { Id = _driverId, IsActive = true, UserId = _userId };
        _mockDriverRepository.GetByIdAsync(_driverId, Arg.Any<CancellationToken>())
            .Returns(driver);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Success.Should().BeTrue();
        result.Value.SeatCapacityWarning.Should().BeFalse();
        result.Value.VehicleSeatCapacity.Should().Be(15);
        result.Value.TourMaxParticipation.Should().Be(10);

        route.VehicleId.Should().Be(_vehicleId);
        route.DriverId.Should().Be(_driverId);
        _mockRouteRepository.Received(1).Update(route);
    }

    [Fact]
    public async Task Handle_WithVehicleSeatCapacityLessThanMaxParticipation_ReturnsWarning()
    {
        var request = new AssignVehicleToRouteCommand(_instanceId, _routeId, _vehicleId, _driverId);

        var route = CreateMockRoute(maxParticipation: 20, transportProviderId: _supplierId, expectedInstanceId: _instanceId);
        _mockRouteRepository.GetDetailsByIdTrackingAsync(_routeId, Arg.Any<CancellationToken>()).Returns(route);

        var vehicle = new VehicleEntity { Id = _vehicleId, SeatCapacity = 15, IsActive = true, OwnerId = _userId }; // 15 < 20
        _mockVehicleRepository.GetByIdAsync(_vehicleId, Arg.Any<CancellationToken>()).Returns(vehicle);

        var driver = new DriverEntity { Id = _driverId, IsActive = true, UserId = _userId };
        _mockDriverRepository.GetByIdAsync(_driverId, Arg.Any<CancellationToken>()).Returns(driver);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.SeatCapacityWarning.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WhenVehicleOwnerMismatch_ReturnsValidationError()
    {
        var request = new AssignVehicleToRouteCommand(_instanceId, _routeId, _vehicleId, _driverId);

        var route = CreateMockRoute(10, _supplierId, _instanceId);
        _mockRouteRepository.GetDetailsByIdTrackingAsync(_routeId, Arg.Any<CancellationToken>()).Returns(route);

        var vehicle = new VehicleEntity { Id = _vehicleId, SeatCapacity = 15, IsActive = true, OwnerId = Guid.NewGuid() }; // Mismatch
        _mockVehicleRepository.GetByIdAsync(_vehicleId, Arg.Any<CancellationToken>()).Returns(vehicle);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Vehicle.NotOwned");
    }

    [Fact]
    public async Task Handle_WhenDriverUserIdMismatch_ReturnsValidationError()
    {
        var request = new AssignVehicleToRouteCommand(_instanceId, _routeId, _vehicleId, _driverId);

        var route = CreateMockRoute(10, _supplierId, _instanceId);
        _mockRouteRepository.GetDetailsByIdTrackingAsync(_routeId, Arg.Any<CancellationToken>()).Returns(route);

        var vehicle = new VehicleEntity { Id = _vehicleId, SeatCapacity = 15, IsActive = true, OwnerId = _userId };
        _mockVehicleRepository.GetByIdAsync(_vehicleId, Arg.Any<CancellationToken>()).Returns(vehicle);

        var driver = new DriverEntity { Id = _driverId, IsActive = true, UserId = Guid.NewGuid() }; // Mismatch
        _mockDriverRepository.GetByIdAsync(_driverId, Arg.Any<CancellationToken>()).Returns(driver);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Driver.NotOwned");
    }

    [Fact]
    public async Task Handle_WhenRouteInstanceIdMismatch_ReturnsNotFoundError()
    {
        var request = new AssignVehicleToRouteCommand(_instanceId, _routeId, _vehicleId, _driverId);

        var route = CreateMockRoute(10, _supplierId, Guid.NewGuid()); // Route belongs to different instance
        _mockRouteRepository.GetDetailsByIdTrackingAsync(_routeId, Arg.Any<CancellationToken>()).Returns(route);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("TourInstancePlanRoute.NotFound");
    }

    [Fact]
    public async Task Handle_WhenTourProviderMismatch_ReturnsValidationError()
    {
        var request = new AssignVehicleToRouteCommand(_instanceId, _routeId, _vehicleId, _driverId);

        var route = CreateMockRoute(10, Guid.NewGuid(), _instanceId); // Different provider Id
        _mockRouteRepository.GetDetailsByIdTrackingAsync(_routeId, Arg.Any<CancellationToken>()).Returns(route);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("TourInstance.ProviderNotAssigned");
    }

    [Fact]
    public async Task Handle_WhenVehicleOrDriverInactive_ReturnsValidationError()
    {
        var request = new AssignVehicleToRouteCommand(_instanceId, _routeId, _vehicleId, _driverId);

        var route = CreateMockRoute(10, _supplierId, _instanceId);
        _mockRouteRepository.GetDetailsByIdTrackingAsync(_routeId, Arg.Any<CancellationToken>()).Returns(route);

        var vehicle = new VehicleEntity { Id = _vehicleId, SeatCapacity = 15, IsActive = false, OwnerId = _userId }; // Inactive
        _mockVehicleRepository.GetByIdAsync(_vehicleId, Arg.Any<CancellationToken>()).Returns(vehicle);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Vehicle.Inactive");
    }
}
