#pragma warning disable CS4014
using global::Application.Common.Interfaces;
using global::Application.Features.TourInstance.Commands;
using global::Application.Services;
using AutoMapper;
using Contracts.Interfaces;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace Domain.Specs.Application.Features.TourInstance.Commands;

/// <summary>
/// §8.4, 8.6, 8.7, 8.8, 8.9 — handler/service flows for per-activity transport and hotel.
/// </summary>
public sealed class TourInstancePerActivityTransportIntegrationTests
{
    [Fact]
    public async Task ApproveTransportation_8_4_TwoSuppliersEachApproveOwn_ThenInstanceActivates()
    {
        var tourRepo = Substitute.For<ITourInstanceRepository>();
        var supplierRepo = Substitute.For<ISupplierRepository>();
        var vehicleRepo = Substitute.For<IVehicleRepository>();
        var driverRepo = Substitute.For<IDriverRepository>();
        var vehicleBlockRepo = Substitute.For<IVehicleBlockRepository>();
        var availability = Substitute.For<IResourceAvailabilityService>();
        var uow = Substitute.For<IUnitOfWork>();
        var user = Substitute.For<IUser>();

        uow.ExecuteTransactionAsync(Arg.Any<Func<Task>>()).Returns(async ci =>
        {
            var a = ci.Arg<Func<Task>>();
            await a();
        });
        uow.ExecuteTransactionAsync(Arg.Any<System.Data.IsolationLevel>(), Arg.Any<Func<Task>>()).Returns(async ci =>
        {
            var a = ci.Arg<Func<Task>>();
            await a();
        });
        uow.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(Task.FromResult(1));

        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();
        var supplierA = Guid.NewGuid();
        var supplierB = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var day = new TourInstanceDayEntity
        {
            Id = Guid.NewGuid(),
            ActualDate = new DateOnly(2026, 7, 1),
            IsDeleted = false
        };
        var act1 = TourInstanceDayActivityEntity.Create(day.Id, 1, TourDayActivityType.Transportation, "T1", "t");
        var act2 = TourInstanceDayActivityEntity.Create(day.Id, 2, TourDayActivityType.Transportation, "T2", "t");
        act1.AssignTransportSupplier(supplierA, VehicleType.Coach, 10);
        act2.AssignTransportSupplier(supplierB, VehicleType.Coach, 10);
        act1.TourInstanceDay = day;
        act2.TourInstanceDay = day;
        day.Activities = [act1, act2];

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            MaxParticipation = 10,
            Status = TourInstanceStatus.PendingApproval,
            InstanceDays = [day]
        };
        day.TourInstance = instance;
        day.TourInstanceId = instance.Id;

        var v1 = Guid.NewGuid();
        var d1 = Guid.NewGuid();
        var v2 = Guid.NewGuid();
        var d2 = Guid.NewGuid();

        tourRepo.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>()).Returns(instance);
        tourRepo.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);
        tourRepo.Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        vehicleBlockRepo.AddAsync(Arg.Any<VehicleBlockEntity>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        vehicleBlockRepo.DeleteByActivityAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        availability.CheckVehicleAvailabilityAsync(Arg.Any<Guid>(), Arg.Any<DateOnly>(), Arg.Any<Guid?>(), Arg.Any<CancellationToken>())
            .Returns(_ => Task.FromResult<ErrorOr<bool>>(true));
        availability.CheckDriverAvailabilityAsync(Arg.Any<Guid>(), Arg.Any<DateOnly>(), Arg.Any<Guid?>(), Arg.Any<CancellationToken>())
            .Returns(_ => Task.FromResult<ErrorOr<bool>>(true));

        vehicleRepo.GetByIdAsync(v1, Arg.Any<CancellationToken>()).Returns(new VehicleEntity
        {
            Id = v1,
            OwnerId = userA,
            SupplierId = supplierA,
            IsActive = true,
            IsDeleted = false,
            VehicleType = VehicleType.Coach,
            SeatCapacity = 20
        });
        vehicleRepo.GetByIdAsync(v2, Arg.Any<CancellationToken>()).Returns(new VehicleEntity
        {
            Id = v2,
            OwnerId = userB,
            SupplierId = supplierB,
            IsActive = true,
            IsDeleted = false,
            VehicleType = VehicleType.Coach,
            SeatCapacity = 20
        });
        driverRepo.GetByIdAsync(d1, Arg.Any<CancellationToken>()).Returns(new DriverEntity { Id = d1, UserId = userA, SupplierId = supplierA, IsActive = true });
        driverRepo.GetByIdAsync(d2, Arg.Any<CancellationToken>()).Returns(new DriverEntity { Id = d2, UserId = userB, SupplierId = supplierB, IsActive = true });

        var handler = new ApproveTransportationActivityCommandHandler(
            tourRepo,
            supplierRepo,
            vehicleRepo,
            driverRepo,
            vehicleBlockRepo,
            availability,
            uow,
            user,
            NullLogger<ApproveTransportationActivityCommandHandler>.Instance);

        // Supplier A approves only activity 1
        user.Id.Returns(userA.ToString());
        supplierRepo.FindAllByOwnerUserIdAsync(userA, Arg.Any<CancellationToken>())
            .Returns([new SupplierEntity { Id = supplierA, OwnerUserId = userA }]);

        var r1 = await handler.Handle(new ApproveTransportationActivityCommand(instanceId, act1.Id, null, v1, d1), CancellationToken.None);
        Assert.False(r1.IsError, r1.IsError ? r1.FirstError.Description : "");
        Assert.Equal(TourInstanceStatus.PendingApproval, instance.Status);

        // Supplier B approves activity 2 — no accommodation needed; both transports approved → Available
        user.Id.Returns(userB.ToString());
        supplierRepo.FindAllByOwnerUserIdAsync(userB, Arg.Any<CancellationToken>())
            .Returns([new SupplierEntity { Id = supplierB, OwnerUserId = userB }]);

        var r2 = await handler.Handle(new ApproveTransportationActivityCommand(instanceId, act2.Id, null, v2, d2), CancellationToken.None);
        Assert.False(r2.IsError);
        Assert.Equal(TourInstanceStatus.Available, instance.Status);
    }

    [Fact]
    public async Task RejectTransportation_8_6_AfterApproved_DeletesVehicleBlockAndFreesStatus()
    {
        var tourRepo = Substitute.For<ITourInstanceRepository>();
        var supplierRepo = Substitute.For<ISupplierRepository>();
        var vehicleBlockRepo = Substitute.For<IVehicleBlockRepository>();
        var user = Substitute.For<IUser>();
        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        user.Id.Returns(userId.ToString());
        supplierRepo.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns([new SupplierEntity { Id = supplierId, OwnerUserId = userId }]);

        var day = new TourInstanceDayEntity { Id = Guid.NewGuid(), ActualDate = new DateOnly(2026, 8, 1), IsDeleted = false };
        var act = TourInstanceDayActivityEntity.Create(day.Id, 1, TourDayActivityType.Transportation, "T", "t");
        act.AssignTransportSupplier(supplierId, VehicleType.Minibus, 8);
        act.ApproveTransportation(Guid.NewGuid(), Guid.NewGuid(), "ok");
        act.TourInstanceDay = day;
        day.Activities = [act];
        var instance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            Status = TourInstanceStatus.Available,
            MaxParticipation = 8,
            InstanceDays = [day]
        };
        day.TourInstance = instance;
        day.TourInstanceId = instance.Id;
        tourRepo.FindByIdWithInstanceDays(instance.Id, Arg.Any<CancellationToken>()).Returns(instance);
        tourRepo.FindByIdWithInstanceDaysForUpdate(instance.Id, Arg.Any<CancellationToken>()).Returns(instance);
        tourRepo.Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        vehicleBlockRepo.DeleteByActivityAsync(act.Id, Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);

        var tourInstanceService = Substitute.For<ITourInstanceService>();
        var handler = new RejectTransportationActivityCommandHandler(tourRepo, supplierRepo, vehicleBlockRepo, user, tourInstanceService);
        var result = await handler.Handle(new RejectTransportationActivityCommand(instance.Id, act.Id, "no"), CancellationToken.None);

        Assert.False(result.IsError);
        await vehicleBlockRepo.Received(1).DeleteByActivityAsync(act.Id, Arg.Any<CancellationToken>());
        Assert.Equal(TourInstanceStatus.PendingApproval, instance.Status);
    }

    [Fact]
    public async Task AssignTransportSupplier_8_7_WhenSupplierChangesOnApproved_DeletesBlockAndResets()
    {
        var tourRepo = Substitute.For<ITourInstanceRepository>();
        var supplierRepo = Substitute.For<ISupplierRepository>();
        var vehicleBlockRepo = Substitute.For<IVehicleBlockRepository>();
        var vehicleRepo = Substitute.For<IVehicleRepository>();
        var user = Substitute.For<IUser>();
        user.Id.Returns(Guid.NewGuid().ToString());

        var oldS = Guid.NewGuid();
        var newS = Guid.NewGuid();
        var day = new TourInstanceDayEntity { Id = Guid.NewGuid(), ActualDate = new DateOnly(2026, 3, 1), IsDeleted = false };
        var act = TourInstanceDayActivityEntity.Create(day.Id, 1, TourDayActivityType.Transportation, "T", "t");
        act.Id = Guid.NewGuid();
        act.AssignTransportSupplier(oldS, VehicleType.Coach, 20);
        act.ApproveTransportation(Guid.NewGuid(), Guid.NewGuid(), "x");
        act.TourInstanceDay = day;
        day.Activities = [act];
        var instance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            Status = TourInstanceStatus.Available,
            MaxParticipation = 20,
            InstanceDays = [day]
        };
        day.TourInstance = instance;
        day.TourInstanceId = instance.Id;
        tourRepo.FindByIdWithInstanceDays(instance.Id, Arg.Any<CancellationToken>()).Returns(instance);
        tourRepo.FindByIdWithInstanceDaysForUpdate(instance.Id, Arg.Any<CancellationToken>()).Returns(instance);
        tourRepo.Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        supplierRepo.GetByIdAsync(newS, Arg.Any<CancellationToken>())
            .Returns(new SupplierEntity { Id = newS, Name = "NewT", IsActive = true, SupplierType = SupplierType.Transport });

        var handler = new AssignTransportSupplierCommandHandler(tourRepo, supplierRepo, vehicleBlockRepo, vehicleRepo, user);
        var result = await handler.Handle(
            new AssignTransportSupplierCommand(instance.Id, act.Id, newS, VehicleType.Van, 20),
            CancellationToken.None);

        Assert.False(result.IsError);
        await vehicleBlockRepo.Received(1).DeleteByActivityAsync(act.Id, Arg.Any<CancellationToken>());
        Assert.Equal(ProviderApprovalStatus.Pending, act.TransportationApprovalStatus);
        Assert.Equal(newS, act.TransportSupplierId);
        Assert.Equal(TourInstanceStatus.PendingApproval, instance.Status);
    }

    [Fact]
    public async Task AssignAccommodationSupplier_8_8_WhenSupplierChanges_DeletesRoomBlockAndResetsApproval()
    {
        var tourRepo = Substitute.For<ITourInstanceRepository>();
        var supplierRepo = Substitute.For<ISupplierRepository>();
        var roomBlockRepo = Substitute.For<IRoomBlockRepository>();
        var user = Substitute.For<IUser>();
        user.Id.Returns(Guid.NewGuid().ToString());

        var oldH = Guid.NewGuid();
        var newH = Guid.NewGuid();
        var day = new TourInstanceDayEntity { Id = Guid.NewGuid(), ActualDate = new DateOnly(2026, 2, 1), IsDeleted = false };
        var act = TourInstanceDayActivityEntity.Create(day.Id, 1, TourDayActivityType.Accommodation, "Hotel", "t");
        act.Id = Guid.NewGuid();
        act.Accommodation = TourInstancePlanAccommodationEntity.Create(act.Id, RoomType.Deluxe, 2, supplierId: oldH);
        act.Accommodation!.ApproveBySupplier(true, "ok");
        act.TourInstanceDay = day;
        day.Activities = [act];
        var instance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            Status = TourInstanceStatus.Available,
            MaxParticipation = 10,
            InstanceDays = [day]
        };
        day.TourInstance = instance;
        day.TourInstanceId = instance.Id;
        tourRepo.FindByIdWithInstanceDays(instance.Id, Arg.Any<CancellationToken>()).Returns(instance);
        tourRepo.Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        supplierRepo.GetByIdAsync(newH, Arg.Any<CancellationToken>())
            .Returns(new SupplierEntity { Id = newH, Name = "H2", IsActive = true, SupplierType = SupplierType.Accommodation });
        roomBlockRepo.DeleteByTourInstanceDayActivityIdAsync(act.Id, Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);

        var handler = new AssignAccommodationSupplierCommandHandler(tourRepo, supplierRepo, roomBlockRepo, user);
        var result = await handler.Handle(
            new AssignAccommodationSupplierCommand(instance.Id, act.Id, newH),
            CancellationToken.None);

        Assert.False(result.IsError);
        await roomBlockRepo.Received(1).DeleteByTourInstanceDayActivityIdAsync(act.Id, Arg.Any<CancellationToken>());
        Assert.Equal(ProviderApprovalStatus.Pending, act.Accommodation!.SupplierApprovalStatus);
        Assert.Equal(newH, act.Accommodation.SupplierId);
        Assert.Equal(TourInstanceStatus.PendingApproval, instance.Status);
    }

    [Fact]
    public async Task ProviderApprove_8_9_HotelRejectAfterApprove_DeletesRoomBlock()
    {
        var instRepo = Substitute.For<ITourInstanceRepository>();
        var tourRepo = Substitute.For<ITourRepository>();
        var trRepo = Substitute.For<ITourRequestRepository>();
        var supRepo = Substitute.For<ISupplierRepository>();
        var vehRepo = Substitute.For<IVehicleRepository>();
        var mailRepo = Substitute.For<IMailRepository>();
        var roomBlockRepo = Substitute.For<IRoomBlockRepository>();
        var invRepo = Substitute.For<IHotelRoomInventoryRepository>();
        var user = Substitute.For<IUser>();
        var mapper = Substitute.For<IMapper>();

        var ownerId = Guid.NewGuid();
        var hotelId = Guid.NewGuid();
        user.Id.Returns(ownerId.ToString());
        supRepo.FindAllByOwnerUserIdAsync(ownerId, Arg.Any<CancellationToken>())
            .Returns([new SupplierEntity { Id = hotelId, Name = "H", OwnerUserId = ownerId, SupplierType = SupplierType.Accommodation }]);

        var actId = Guid.NewGuid();
        var day = new TourInstanceDayEntity
        {
            Id = Guid.NewGuid(),
            InstanceDayNumber = 1,
            ActualDate = new DateOnly(2026, 4, 10),
            IsDeleted = false
        };
        var act = TourInstanceDayActivityEntity.Create(day.Id, 1, TourDayActivityType.Accommodation, "Stay", "t");
        act.Id = actId;
        act.Accommodation = TourInstancePlanAccommodationEntity.Create(actId, RoomType.Standard, 1, supplierId: hotelId);
        act.Accommodation.ApproveBySupplier(true, "y");
        act.TourInstanceDay = day;
        day.Activities = [act];
        var instance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            Status = TourInstanceStatus.PendingApproval,
            MaxParticipation = 5,
            InstanceDays = [day]
        };
        day.TourInstance = instance;
        day.TourInstanceId = instance.Id;
        var existingBlock = RoomBlockEntity.Create(
            hotelId,
            RoomType.Standard,
            day.ActualDate,
            1,
            ownerId.ToString(),
            tourInstanceDayActivityId: actId,
            holdStatus: HoldStatus.Hard);
        instRepo.FindById(instance.Id, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);
        instRepo.FindByIdWithInstanceDays(instance.Id, Arg.Any<CancellationToken>()).Returns(instance);
        instRepo.Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        roomBlockRepo.GetByTourInstanceDayActivityIdsAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new[] { existingBlock });
        roomBlockRepo.DeleteByTourInstanceDayActivityIdAsync(actId, Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);

        var service = new TourInstanceService(
            instRepo,
            tourRepo,
            trRepo,
            supRepo,
            vehRepo,
            mailRepo,
            roomBlockRepo,
            invRepo,
            user,
            mapper,
            NullLogger<TourInstanceService>.Instance,
            Substitute.For<ICloudinaryService>(),
            notificationBroadcaster: null);

        var reject = await service.ProviderApprove(
            instance.Id,
            isApproved: false,
            "cannot",
            "Hotel",
            [actId],
            cancellationToken: CancellationToken.None);

        Assert.False(reject.IsError);
        await roomBlockRepo.Received(1).DeleteByTourInstanceDayActivityIdAsync(actId, Arg.Any<CancellationToken>());
    }
}

#pragma warning restore CS4014
