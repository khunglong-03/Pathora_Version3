using Application.Common.Interfaces;
using Application.Features.TourInstance.Commands;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using NSubstitute;

namespace Domain.Specs.Application.Features.TourInstance.Commands;

public sealed class ApproveTransportationActivityCommandHandlerContractTests
{
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

        tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

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

        var handler = new ApproveTransportationActivityCommandHandler(
            tourInstanceRepository,
            supplierRepository,
            vehicleRepository,
            driverRepository,
            vehicleBlockRepository,
            availabilityService,
            unitOfWork,
            user);

        var result = await handler.Handle(
            new ApproveTransportationActivityCommand(instanceId, activityId, vehicleId, driverId),
            CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "Vehicle.InsufficientCapacity");
        await unitOfWork.DidNotReceive().ExecuteTransactionAsync(Arg.Any<Func<Task>>());
        await unitOfWork.DidNotReceive().ExecuteTransactionAsync(Arg.Any<System.Data.IsolationLevel>(), Arg.Any<Func<Task>>());
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

        tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

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

        var handler = new ApproveTransportationActivityCommandHandler(
            tourInstanceRepository,
            supplierRepository,
            vehicleRepository,
            driverRepository,
            vehicleBlockRepository,
            availabilityService,
            unitOfWork,
            user);

        var result = await handler.Handle(
            new ApproveTransportationActivityCommand(instanceId, activityId, vehicleId, driverId),
            CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "Vehicle.WrongType");
        await unitOfWork.DidNotReceive().ExecuteTransactionAsync(Arg.Any<Func<Task>>());
        await unitOfWork.DidNotReceive().ExecuteTransactionAsync(Arg.Any<System.Data.IsolationLevel>(), Arg.Any<Func<Task>>());
        await vehicleBlockRepository.DidNotReceive().AddAsync(Arg.Any<VehicleBlockEntity>(), Arg.Any<CancellationToken>());
    }
}
