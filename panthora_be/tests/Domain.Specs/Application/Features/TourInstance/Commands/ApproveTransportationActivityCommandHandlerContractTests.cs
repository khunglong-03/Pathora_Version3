using global::Application.Common.Interfaces;
using global::Application.Features.TourInstance.Commands;
using Contracts.Interfaces;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace Domain.Specs.Application.Features.TourInstance.Commands;

public sealed class ApproveTransportationActivityCommandHandlerContractTests
{
    private static readonly NullLogger<ApproveTransportationActivityCommandHandler> _logger = new();

    [Fact]
    public async Task Handle_8_11_WhenVehicleSeatCapacityLessThanRequested_ReturnsVehicleInsufficientCapacity()
    {
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var supplierRepository = Substitute.For<ISupplierRepository>();
        var vehicleRepository = Substitute.For<IVehicleRepository>();
        var driverRepository = Substitute.For<IDriverRepository>();
        var vehicleBlockRepository = Substitute.For<IVehicleBlockRepository>();
        var availabilityService = Substitute.For<IResourceAvailabilityService>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var user = Substitute.For<IUser>();

        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        user.Id.Returns(userId.ToString());
        supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns([new SupplierEntity { Id = supplierId, OwnerUserId = userId }]);

        var day = new TourInstanceDayEntity
        {
            Id = Guid.NewGuid(),
            ActualDate = new DateOnly(2026, 5, 1),
            IsDeleted = false
        };
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id, 1, TourDayActivityType.Transportation, "Transfer", "t");
        var activityId = activity.Id;
        activity.TransportSupplierId = supplierId;
        activity.TransportationType = TransportationType.Bus;
        activity.RequestedVehicleType = VehicleType.Coach;
        activity.RequestedSeatCount = 25;
        activity.TourInstanceDayId = day.Id;
        activity.TourInstanceDay = day;
        day.Activities = [activity];

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            MaxParticipation = 10,
            Status = TourInstanceStatus.PendingApproval,
            InstanceDays = [day]
        };

        tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        var vehicle = new VehicleEntity
        {
            Id = vehicleId,
            OwnerId = userId,
            IsActive = true,
            IsDeleted = false,
            VehicleType = VehicleType.Coach,
            SeatCapacity = 20
        };
        vehicleRepository.GetByIdAsync(vehicleId, Arg.Any<CancellationToken>()).Returns(vehicle);
        driverRepository.GetByIdAsync(driverId, Arg.Any<CancellationToken>())
            .Returns(new DriverEntity { Id = driverId, UserId = userId, IsActive = true });

        var handler = new ApproveTransportationActivityCommandHandler(
            tourInstanceRepository,
            supplierRepository,
            vehicleRepository,
            driverRepository,
            vehicleBlockRepository,
            availabilityService,
            unitOfWork,
            user,
            _logger);

        var result = await handler.Handle(
            new ApproveTransportationActivityCommand(instanceId, activityId, null, vehicleId, driverId),
            CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "Vehicle.InsufficientCapacity");
        await unitOfWork.DidNotReceive().ExecuteTransactionAsync(Arg.Any<Func<Task>>());
        await unitOfWork.DidNotReceive().ExecuteTransactionAsync(Arg.Any<System.Data.IsolationLevel>(), Arg.Any<Func<Task>>());
    }

    [Fact]
    public async Task Handle_WhenTransportationIsExternal_ReturnsNotProviderManagedError()
    {
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var supplierRepository = Substitute.For<ISupplierRepository>();
        var vehicleRepository = Substitute.For<IVehicleRepository>();
        var driverRepository = Substitute.For<IDriverRepository>();
        var vehicleBlockRepository = Substitute.For<IVehicleBlockRepository>();
        var availabilityService = Substitute.For<IResourceAvailabilityService>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var user = Substitute.For<IUser>();

        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();

        user.Id.Returns(userId.ToString());
        supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns([new SupplierEntity { Id = supplierId, OwnerUserId = userId }]);

        var day = new TourInstanceDayEntity
        {
            Id = Guid.NewGuid(),
            ActualDate = new DateOnly(2026, 5, 1),
            IsDeleted = false
        };
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id, 1, TourDayActivityType.Transportation, "Flight", "t");
        var activityId = activity.Id;
        activity.TransportSupplierId = supplierId;
        activity.TransportationType = TransportationType.Flight; // External
        activity.TourInstanceDayId = day.Id;
        activity.TourInstanceDay = day;
        day.Activities = [activity];

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            MaxParticipation = 10,
            Status = TourInstanceStatus.PendingApproval,
            InstanceDays = [day]
        };

        tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        var handler = new ApproveTransportationActivityCommandHandler(
            tourInstanceRepository,
            supplierRepository,
            vehicleRepository,
            driverRepository,
            vehicleBlockRepository,
            availabilityService,
            unitOfWork,
            user,
            _logger);

        var result = await handler.Handle(
            new ApproveTransportationActivityCommand(instanceId, activityId, null, Guid.NewGuid(), Guid.NewGuid()),
            CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstanceActivity.NotProviderManaged");
    }

    [Fact]
    public async Task Handle_WhenAssignmentsContainDuplicateVehicle_ReturnsDuplicateVehicleInActivity()
    {
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var supplierRepository = Substitute.For<ISupplierRepository>();
        var vehicleRepository = Substitute.For<IVehicleRepository>();
        var driverRepository = Substitute.For<IDriverRepository>();
        var vehicleBlockRepository = Substitute.For<IVehicleBlockRepository>();
        var availabilityService = Substitute.For<IResourceAvailabilityService>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var user = Substitute.For<IUser>();

        var userId = Guid.NewGuid();
        user.Id.Returns(userId.ToString());

        var supplierId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverId1 = Guid.NewGuid();
        var driverId2 = Guid.NewGuid();

        var day = new TourInstanceDayEntity { Id = Guid.NewGuid(), ActualDate = new DateOnly(2026, 5, 1) };
        var activity = TourInstanceDayActivityEntity.Create(day.Id, 1, TourDayActivityType.Transportation, "Transfer", "t");
        var activityId = activity.Id;
        activity.TransportSupplierId = supplierId;
        activity.TransportationType = TransportationType.Bus;
        // Do not set RequestedVehicleType to trigger the duplicate vehicle check
        activity.TourInstanceDayId = day.Id;
        activity.TourInstanceDay = day;
        day.Activities = [activity];

        var instance = new TourInstanceEntity { Id = instanceId, InstanceDays = [day] };
        tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        var handler = new ApproveTransportationActivityCommandHandler(
            tourInstanceRepository,
            supplierRepository,
            vehicleRepository,
            driverRepository,
            vehicleBlockRepository,
            availabilityService,
            unitOfWork,
            user,
            _logger);

        var assignments = new List<TransportApprovalAssignmentDto>
        {
            new(vehicleId, driverId1),
            new(vehicleId, driverId2),
        };

        var result = await handler.Handle(
            new ApproveTransportationActivityCommand(instanceId, activityId, assignments),
            CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstanceActivity.DuplicateVehicle");
    }

    [Fact]
    public async Task Handle_WhenAssignmentsContainDuplicateDriver_ReturnsDuplicateDriverInActivity()
    {
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var supplierRepository = Substitute.For<ISupplierRepository>();
        var vehicleRepository = Substitute.For<IVehicleRepository>();
        var driverRepository = Substitute.For<IDriverRepository>();
        var vehicleBlockRepository = Substitute.For<IVehicleBlockRepository>();
        var availabilityService = Substitute.For<IResourceAvailabilityService>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var user = Substitute.For<IUser>();

        var userId = Guid.NewGuid();
        user.Id.Returns(userId.ToString());

        var instanceId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var vehicleId1 = Guid.NewGuid();
        var vehicleId2 = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        // The DuplicateDriver check runs very early, before DB lookups.
        var handler = new ApproveTransportationActivityCommandHandler(
            tourInstanceRepository,
            supplierRepository,
            vehicleRepository,
            driverRepository,
            vehicleBlockRepository,
            availabilityService,
            unitOfWork,
            user,
            _logger);

        var assignments = new List<TransportApprovalAssignmentDto>
        {
            new(vehicleId1, driverId),
            new(vehicleId2, driverId),
        };

        var result = await handler.Handle(
            new ApproveTransportationActivityCommand(instanceId, activityId, assignments),
            CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstanceActivity.DuplicateDriver");
    }

    [Fact]
    public async Task Handle_WhenVehicleCountDoesNotMatchRequested_ReturnsVehicleCountMismatch()
    {
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var supplierRepository = Substitute.For<ISupplierRepository>();
        var vehicleRepository = Substitute.For<IVehicleRepository>();
        var driverRepository = Substitute.For<IDriverRepository>();
        var vehicleBlockRepository = Substitute.For<IVehicleBlockRepository>();
        var availabilityService = Substitute.For<IResourceAvailabilityService>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var user = Substitute.For<IUser>();

        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        user.Id.Returns(userId.ToString());
        supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns([new SupplierEntity { Id = supplierId, OwnerUserId = userId }]);

        var day = new TourInstanceDayEntity
        {
            Id = Guid.NewGuid(),
            ActualDate = new DateOnly(2026, 5, 4),
            IsDeleted = false
        };
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id, 1, TourDayActivityType.Transportation, "Transfer", "t");
        var activityId = activity.Id;
        activity.TransportSupplierId = supplierId;
        activity.TransportationType = TransportationType.Bus;
        activity.RequestedVehicleType = VehicleType.Coach;
        activity.RequestedSeatCount = 20;
        activity.RequestedVehicleCount = 2; // manager asked for 2 vehicles
        activity.TourInstanceDayId = day.Id;
        activity.TourInstanceDay = day;
        day.Activities = [activity];

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            MaxParticipation = 10,
            Status = TourInstanceStatus.PendingApproval,
            InstanceDays = [day]
        };

        tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        var handler = new ApproveTransportationActivityCommandHandler(
            tourInstanceRepository,
            supplierRepository,
            vehicleRepository,
            driverRepository,
            vehicleBlockRepository,
            availabilityService,
            unitOfWork,
            user,
            _logger);

        // Provider tries to approve with only 1 vehicle row — mismatch.
        var result = await handler.Handle(
            new ApproveTransportationActivityCommand(
                instanceId,
                activityId,
                new List<TransportApprovalAssignmentDto> { new(vehicleId, driverId) }),
            CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstanceActivity.VehicleCountMismatch");
        await vehicleRepository.DidNotReceive().GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenTwoVehicleFleetSeatsInsufficient_ReturnsFleetInsufficientCapacity()
    {
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var supplierRepository = Substitute.For<ISupplierRepository>();
        var vehicleRepository = Substitute.For<IVehicleRepository>();
        var driverRepository = Substitute.For<IDriverRepository>();
        var vehicleBlockRepository = Substitute.For<IVehicleBlockRepository>();
        var availabilityService = Substitute.For<IResourceAvailabilityService>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var user = Substitute.For<IUser>();

        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var vehicleA = Guid.NewGuid();
        var vehicleB = Guid.NewGuid();
        var driverA = Guid.NewGuid();
        var driverB = Guid.NewGuid();

        user.Id.Returns(userId.ToString());
        supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns([new SupplierEntity { Id = supplierId, OwnerUserId = userId }]);

        var day = new TourInstanceDayEntity
        {
            Id = Guid.NewGuid(),
            ActualDate = new DateOnly(2026, 5, 3),
            IsDeleted = false
        };
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id, 1, TourDayActivityType.Transportation, "Transfer", "t");
        var activityId = activity.Id;
        activity.TransportSupplierId = supplierId;
        activity.TransportationType = TransportationType.Bus;
        activity.RequestedVehicleType = VehicleType.Coach;
        activity.RequestedSeatCount = 50;
        activity.TourInstanceDayId = day.Id;
        activity.TourInstanceDay = day;
        day.Activities = [activity];

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            MaxParticipation = 30,
            Status = TourInstanceStatus.PendingApproval,
            InstanceDays = [day]
        };

        tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        vehicleRepository.GetByIdAsync(vehicleA, Arg.Any<CancellationToken>()).Returns(new VehicleEntity
        {
            Id = vehicleA,
            OwnerId = userId,
            IsActive = true,
            IsDeleted = false,
            VehicleType = VehicleType.Coach,
            SeatCapacity = 16
        });
        vehicleRepository.GetByIdAsync(vehicleB, Arg.Any<CancellationToken>()).Returns(new VehicleEntity
        {
            Id = vehicleB,
            OwnerId = userId,
            IsActive = true,
            IsDeleted = false,
            VehicleType = VehicleType.Coach,
            SeatCapacity = 16
        });
        driverRepository.GetByIdAsync(driverA, Arg.Any<CancellationToken>())
            .Returns(new DriverEntity { Id = driverA, UserId = userId, IsActive = true });
        driverRepository.GetByIdAsync(driverB, Arg.Any<CancellationToken>())
            .Returns(new DriverEntity { Id = driverB, UserId = userId, IsActive = true });

        var handler = new ApproveTransportationActivityCommandHandler(
            tourInstanceRepository,
            supplierRepository,
            vehicleRepository,
            driverRepository,
            vehicleBlockRepository,
            availabilityService,
            unitOfWork,
            user,
            _logger);

        var assignments = new List<TransportApprovalAssignmentDto>
        {
            new(vehicleA, driverA),
            new(vehicleB, driverB),
        };

        var result = await handler.Handle(
            new ApproveTransportationActivityCommand(instanceId, activityId, assignments),
            CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstanceActivity.TransportFleetInsufficientCapacity");
        await vehicleBlockRepository.DidNotReceive().AddAsync(Arg.Any<VehicleBlockEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_11_6_2_WhenVehicleTypeDoesNotMatchRequestedType_ReturnsVehicleWrongType()
    {
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var supplierRepository = Substitute.For<ISupplierRepository>();
        var vehicleRepository = Substitute.For<IVehicleRepository>();
        var driverRepository = Substitute.For<IDriverRepository>();
        var vehicleBlockRepository = Substitute.For<IVehicleBlockRepository>();
        var availabilityService = Substitute.For<IResourceAvailabilityService>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var user = Substitute.For<IUser>();

        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        user.Id.Returns(userId.ToString());
        supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns([new SupplierEntity { Id = supplierId, OwnerUserId = userId }]);

        var day = new TourInstanceDayEntity
        {
            Id = Guid.NewGuid(),
            ActualDate = new DateOnly(2026, 5, 2),
            IsDeleted = false
        };
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id, 1, TourDayActivityType.Transportation, "Transfer", "t");
        var activityId = activity.Id;
        activity.TransportSupplierId = supplierId;
        activity.TransportationType = TransportationType.Bus;
        activity.RequestedVehicleType = VehicleType.Coach;
        activity.RequestedSeatCount = 10;
        activity.TourInstanceDayId = day.Id;
        activity.TourInstanceDay = day;
        day.Activities = [activity];

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            MaxParticipation = 10,
            Status = TourInstanceStatus.PendingApproval,
            InstanceDays = [day]
        };

        tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        var vehicle = new VehicleEntity
        {
            Id = vehicleId,
            OwnerId = userId,
            IsActive = true,
            IsDeleted = false,
            VehicleType = VehicleType.Car,
            SeatCapacity = 30
        };
        vehicleRepository.GetByIdAsync(vehicleId, Arg.Any<CancellationToken>()).Returns(vehicle);
        driverRepository.GetByIdAsync(driverId, Arg.Any<CancellationToken>())
            .Returns(new DriverEntity { Id = driverId, UserId = userId, IsActive = true });

        var handler = new ApproveTransportationActivityCommandHandler(
            tourInstanceRepository,
            supplierRepository,
            vehicleRepository,
            driverRepository,
            vehicleBlockRepository,
            availabilityService,
            unitOfWork,
            user,
            _logger);

        var result = await handler.Handle(
            new ApproveTransportationActivityCommand(instanceId, activityId, null, vehicleId, driverId),
            CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "Vehicle.WrongType");
        await unitOfWork.DidNotReceive().ExecuteTransactionAsync(Arg.Any<Func<Task>>());
        await unitOfWork.DidNotReceive().ExecuteTransactionAsync(Arg.Any<System.Data.IsolationLevel>(), Arg.Any<Func<Task>>());
        await vehicleBlockRepository.DidNotReceive().AddAsync(Arg.Any<VehicleBlockEntity>(), Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(TransportationType.Flight)]
    [InlineData(TransportationType.Train)]
    [InlineData(TransportationType.Boat)]
    [InlineData(TransportationType.Other)]
    [InlineData(TransportationType.Walking)]
    public async Task Handle_WhenActivityIsNotGround_ReturnsActivityNotProviderManaged(TransportationType nonGroundType)
    {
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var supplierRepository = Substitute.For<ISupplierRepository>();
        var vehicleRepository = Substitute.For<IVehicleRepository>();
        var driverRepository = Substitute.For<IDriverRepository>();
        var vehicleBlockRepository = Substitute.For<IVehicleBlockRepository>();
        var availabilityService = Substitute.For<IResourceAvailabilityService>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var user = Substitute.For<IUser>();

        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        user.Id.Returns(userId.ToString());
        supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns([new SupplierEntity { Id = supplierId, OwnerUserId = userId }]);

        var day = new TourInstanceDayEntity
        {
            Id = Guid.NewGuid(),
            ActualDate = new DateOnly(2026, 5, 5),
            IsDeleted = false
        };
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id, 1, TourDayActivityType.Transportation, "External", "t");
        var activityId = activity.Id;
        // Provider should NOT be approving non-Ground activities even if a supplier is assigned.
        activity.TransportSupplierId = supplierId;
        activity.TransportationType = nonGroundType;
        activity.TourInstanceDayId = day.Id;
        activity.TourInstanceDay = day;
        day.Activities = [activity];

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            MaxParticipation = 10,
            Status = TourInstanceStatus.PendingApproval,
            InstanceDays = [day]
        };

        tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        var handler = new ApproveTransportationActivityCommandHandler(
            tourInstanceRepository,
            supplierRepository,
            vehicleRepository,
            driverRepository,
            vehicleBlockRepository,
            availabilityService,
            unitOfWork,
            user,
            _logger);

        var result = await handler.Handle(
            new ApproveTransportationActivityCommand(instanceId, activityId, null, vehicleId, driverId),
            CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstanceActivity.NotProviderManaged");
        await vehicleRepository.DidNotReceive().GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        await vehicleBlockRepository.DidNotReceive().AddAsync(Arg.Any<VehicleBlockEntity>(), Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(TransportationType.Bus)]
    [InlineData(TransportationType.Car)]
    [InlineData(TransportationType.Motorbike)]
    [InlineData(TransportationType.Taxi)]
    [InlineData(TransportationType.Bicycle)]
    public async Task Handle_WhenActivityIsGround_PassesGuardAndContinues(TransportationType groundType)
    {
        // Ground types must NOT trigger the NotProviderManaged guard. We let the request fall through
        // to the next validation (NoSupplier here, since we only set TransportationType — no supplier),
        // which is sufficient evidence the new guard let it pass.
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var supplierRepository = Substitute.For<ISupplierRepository>();
        var vehicleRepository = Substitute.For<IVehicleRepository>();
        var driverRepository = Substitute.For<IDriverRepository>();
        var vehicleBlockRepository = Substitute.For<IVehicleBlockRepository>();
        var availabilityService = Substitute.For<IResourceAvailabilityService>();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var user = Substitute.For<IUser>();

        var userId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        user.Id.Returns(userId.ToString());

        var day = new TourInstanceDayEntity
        {
            Id = Guid.NewGuid(),
            ActualDate = new DateOnly(2026, 5, 6),
            IsDeleted = false
        };
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id, 1, TourDayActivityType.Transportation, "Ground transfer", "t");
        var activityId = activity.Id;
        activity.TransportationType = groundType;
        activity.TourInstanceDayId = day.Id;
        activity.TourInstanceDay = day;
        day.Activities = [activity];

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            MaxParticipation = 10,
            Status = TourInstanceStatus.PendingApproval,
            InstanceDays = [day]
        };

        tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        var handler = new ApproveTransportationActivityCommandHandler(
            tourInstanceRepository,
            supplierRepository,
            vehicleRepository,
            driverRepository,
            vehicleBlockRepository,
            availabilityService,
            unitOfWork,
            user,
            _logger);

        var result = await handler.Handle(
            new ApproveTransportationActivityCommand(instanceId, activityId, null, vehicleId, driverId),
            CancellationToken.None);

        Assert.True(result.IsError);
        // Guard let it through; next check (NoSupplier) fires instead.
        Assert.DoesNotContain(result.Errors, e => e.Code == "TourInstanceActivity.NotProviderManaged");
        Assert.Contains(result.Errors, e => e.Code == "TourInstanceActivity.NoSupplier");
    }
}
