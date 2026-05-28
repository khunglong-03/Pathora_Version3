using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.Features.TourInstance.EventHandlers;
using Application.Services;
using AutoMapper;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Events;
using Domain.Mails;
using Domain.ValueObjects;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace Domain.Specs.Application.Features.TourInstance;

public sealed class ProviderRejectedTourInstanceNotificationTests
{
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly ITourRequestRepository _tourRequestRepository = Substitute.For<ITourRequestRepository>();
    private readonly ISupplierRepository _supplierRepository = Substitute.For<ISupplierRepository>();
    private readonly IVehicleRepository _vehicleRepository = Substitute.For<IVehicleRepository>();
    private readonly IMailRepository _mailRepository = Substitute.For<IMailRepository>();
    private readonly IRoomBlockRepository _roomBlockRepository = Substitute.For<IRoomBlockRepository>();
    private readonly IHotelRoomInventoryRepository _hotelRoomInventoryRepository = Substitute.For<IHotelRoomInventoryRepository>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly IMapper _mapper = Substitute.For<IMapper>();
    private readonly ITourInstanceNotificationBroadcaster _notificationBroadcaster = Substitute.For<ITourInstanceNotificationBroadcaster>();
    private readonly ILogger<TourInstanceService> _serviceLogger = Substitute.For<ILogger<TourInstanceService>>();

    private TourInstanceService CreateService()
    {
        return new TourInstanceService(
            _tourInstanceRepository,
            _tourRepository,
            _tourRequestRepository,
            _supplierRepository,
            _vehicleRepository,
            _mailRepository,
            _roomBlockRepository,
            _hotelRoomInventoryRepository,
            _user,
            _mapper,
            _serviceLogger,
            Substitute.For<ICloudinaryService>(),
            null,
            _notificationBroadcaster);
    }

    private static TourInstanceEntity CreateTestInstance(Guid instanceId)
    {
        var managerUserId = Guid.NewGuid().ToString();
        var instance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Test Tour Instance",
            tourName: "Test Tour Instance",
            tourCode: "TI-TEST",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow.Date,
            endDate: DateTimeOffset.UtcNow.Date.AddDays(1),
            maxParticipation: 10,
            basePrice: 100m,
            performedBy: managerUserId,
            requiresApproval: true);

        instance.Id = instanceId;
        instance.Status = TourInstanceStatus.PendingApproval;

        var day = TourInstanceDayEntity.Create(
            instance.Id,
            Guid.NewGuid(),
            1,
            DateOnly.FromDateTime(DateTime.UtcNow.Date),
            "Day 1",
            "tester");

        instance.InstanceDays.Add(day);
        return instance;
    }

    [Fact]
    public async Task ProviderApprove_HotelReject_RaisesProviderRejectedEvent_T1()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();

        var instance = CreateTestInstance(instanceId);
        var act = TourInstanceDayActivityEntity.Create(instance.InstanceDays[0].Id, 1, TourDayActivityType.Accommodation, "Hotel Activity", "tester");
        act.Accommodation = TourInstancePlanAccommodationEntity.Create(act.Id, RoomType.Standard, 1, supplierId: supplierId);
        act.Accommodation.SupplierApprovalStatus = ProviderApprovalStatus.Pending;
        act.TourInstanceDay = instance.InstanceDays[0];
        instance.InstanceDays[0].Activities.Add(act);

        var supplier = new SupplierEntity
        {
            Id = supplierId,
            Name = "Hotel Name",
            OwnerUserId = ownerUserId
        };

        _user.Id.Returns(ownerUserId.ToString());
        _supplierRepository.FindAllByOwnerUserIdAsync(ownerUserId, Arg.Any<CancellationToken>()).Returns(new List<SupplierEntity> { supplier });
        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>()).Returns(instance);
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        var service = CreateService();

        // Act
        var result = await service.ProviderApprove(
            instanceId,
            isApproved: false,
            note: "Rejection note",
            providerType: "Hotel",
            accommodationActivityIds: new[] { act.Id },
            cancellationToken: CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(instance.DomainEvents);
        var domainEvent = instance.DomainEvents.First() as ProviderRejectedTourInstanceEvent;
        Assert.NotNull(domainEvent);
        Assert.Equal(instanceId, domainEvent.TourInstanceId);
        Assert.Equal(supplierId, domainEvent.SupplierId);
        Assert.Equal("Hotel Name", domainEvent.SupplierName);
        Assert.Equal("Hotel", domainEvent.ProviderType);
        Assert.Equal("Rejection note", domainEvent.Note);
        Assert.Single(domainEvent.Activities);
        Assert.Equal(act.Id, domainEvent.Activities[0].ActivityId);
        Assert.Equal(1, domainEvent.Activities[0].DayNumber);
    }

    [Fact]
    public async Task ProviderApprove_BulkReject_RaisesOneEventWithMultipleActivities_T2()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();

        var instance = CreateTestInstance(instanceId);
        var supplier = new SupplierEntity { Id = supplierId, Name = "Hotel Name", OwnerUserId = ownerUserId };

        var actIds = new List<Guid>();
        for (int i = 1; i <= 80; i++)
        {
            var act = TourInstanceDayActivityEntity.Create(instance.InstanceDays[0].Id, i, TourDayActivityType.Accommodation, $"Hotel Activity {i}", "tester");
            act.Accommodation = TourInstancePlanAccommodationEntity.Create(act.Id, RoomType.Standard, 1, supplierId: supplierId);
            act.Accommodation.SupplierApprovalStatus = ProviderApprovalStatus.Pending;
            act.TourInstanceDay = instance.InstanceDays[0];
            instance.InstanceDays[0].Activities.Add(act);
            actIds.Add(act.Id);
        }

        _user.Id.Returns(ownerUserId.ToString());
        _supplierRepository.FindAllByOwnerUserIdAsync(ownerUserId, Arg.Any<CancellationToken>()).Returns(new List<SupplierEntity> { supplier });
        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>()).Returns(instance);
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        var service = CreateService();

        // Act
        var result = await service.ProviderApprove(
            instanceId,
            isApproved: false,
            note: "Bulk reject note",
            providerType: "Hotel",
            accommodationActivityIds: actIds,
            cancellationToken: CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(instance.DomainEvents);
        var domainEvent = instance.DomainEvents.First() as ProviderRejectedTourInstanceEvent;
        Assert.NotNull(domainEvent);
        Assert.Equal(80, domainEvent.Activities.Count);
    }

    [Fact]
    public async Task ProviderApprove_TransportReject_RaisesEventWithTransportType_T3()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();

        var instance = CreateTestInstance(instanceId);
        var act = TourInstanceDayActivityEntity.Create(instance.InstanceDays[0].Id, 1, TourDayActivityType.Transportation, "Transport Activity", "tester");
        act.TransportSupplierId = supplierId;
        act.TransportationApprovalStatus = ProviderApprovalStatus.Pending;
        act.TourInstanceDay = instance.InstanceDays[0];
        instance.InstanceDays[0].Activities.Add(act);

        var supplier = new SupplierEntity { Id = supplierId, Name = "Transport Name", OwnerUserId = ownerUserId };

        _user.Id.Returns(ownerUserId.ToString());
        _supplierRepository.FindAllByOwnerUserIdAsync(ownerUserId, Arg.Any<CancellationToken>()).Returns(new List<SupplierEntity> { supplier });
        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>()).Returns(instance);
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        var service = CreateService();

        // Act
        var result = await service.ProviderApprove(
            instanceId,
            isApproved: false,
            note: "Transport rejection note",
            providerType: "Transport",
            transportationActivityIds: new[] { act.Id },
            cancellationToken: CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(instance.DomainEvents);
        var domainEvent = instance.DomainEvents.First() as ProviderRejectedTourInstanceEvent;
        Assert.NotNull(domainEvent);
        Assert.Equal("Transport", domainEvent.ProviderType);
        Assert.Equal("Transport Name", domainEvent.SupplierName);
    }

    [Fact]
    public async Task ProviderApprove_AlreadyAtTarget_DoesNotRaiseEvent_T4()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();

        var instance = CreateTestInstance(instanceId);
        var act = TourInstanceDayActivityEntity.Create(instance.InstanceDays[0].Id, 1, TourDayActivityType.Accommodation, "Hotel Activity", "tester");
        act.Accommodation = TourInstancePlanAccommodationEntity.Create(act.Id, RoomType.Standard, 1, supplierId: supplierId);
        act.Accommodation.SupplierApprovalStatus = ProviderApprovalStatus.Rejected;
        act.TourInstanceDay = instance.InstanceDays[0];
        instance.InstanceDays[0].Activities.Add(act);

        var supplier = new SupplierEntity { Id = supplierId, Name = "Hotel Name", OwnerUserId = ownerUserId };

        _user.Id.Returns(ownerUserId.ToString());
        _supplierRepository.FindAllByOwnerUserIdAsync(ownerUserId, Arg.Any<CancellationToken>()).Returns(new List<SupplierEntity> { supplier });
        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>()).Returns(instance);
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        var service = CreateService();

        // Act
        var result = await service.ProviderApprove(
            instanceId,
            isApproved: false,
            note: "Already rejected",
            providerType: "Hotel",
            accommodationActivityIds: new[] { act.Id },
            cancellationToken: CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Empty(instance.DomainEvents);
    }

    [Fact]
    public async Task ProviderApprove_ApproveIsTrue_DoesNotRaiseEvent_T5()
    {
        // Arrange
        var instanceId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();

        var instance = CreateTestInstance(instanceId);
        var act = TourInstanceDayActivityEntity.Create(instance.InstanceDays[0].Id, 1, TourDayActivityType.Accommodation, "Hotel Activity", "tester");
        act.Accommodation = TourInstancePlanAccommodationEntity.Create(act.Id, RoomType.Standard, 1, supplierId: supplierId);
        act.Accommodation.SupplierApprovalStatus = ProviderApprovalStatus.Pending;
        act.TourInstanceDay = instance.InstanceDays[0];
        instance.InstanceDays[0].Activities.Add(act);

        var supplier = new SupplierEntity { Id = supplierId, Name = "Hotel Name", OwnerUserId = ownerUserId };

        _user.Id.Returns(ownerUserId.ToString());
        _supplierRepository.FindAllByOwnerUserIdAsync(ownerUserId, Arg.Any<CancellationToken>()).Returns(new List<SupplierEntity> { supplier });
        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>()).Returns(instance);
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        // Mock room block for approve logic
        _roomBlockRepository.GetByTourInstanceDayActivityIdsAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new[]
            {
                RoomBlockEntity.Create(
                    supplierId: supplierId,
                    roomType: RoomType.Standard,
                    blockedDate: instance.InstanceDays[0].ActualDate,
                    roomCountBlocked: 1,
                    performedBy: ownerUserId.ToString(),
                    tourInstanceDayActivityId: act.Id,
                    holdStatus: HoldStatus.Hard)
            });

        var service = CreateService();

        // Act
        var result = await service.ProviderApprove(
            instanceId,
            isApproved: true,
            note: "Approved note",
            providerType: "Hotel",
            accommodationActivityIds: new[] { act.Id },
            cancellationToken: CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Empty(instance.DomainEvents.OfType<ProviderRejectedTourInstanceEvent>());
    }

    [Fact]
    public async Task EventHandler_WithValidTourOperator_CallsMailRepositoryAdd_T6()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var tourInstance = CreateTestInstance(tourInstanceId);

        var tourOperator = new UserEntity { Id = Guid.NewGuid(), Email = "operator@test.com", FullName = "Operator Name" };
        var tour = new TourEntity { Id = Guid.NewGuid(), TourOperator = tourOperator };
        tourInstance.Tour = tour;

        var mailRepository = Substitute.For<IMailRepository>();
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var config = Substitute.For<IConfiguration>();
        var logger = Substitute.For<ILogger<ProviderRejectedTourInstanceEventHandler>>();

        tourInstanceRepository.FindByIdForRejectNotification(tourInstanceId, Arg.Any<CancellationToken>()).Returns(tourInstance);
        config["App:BaseUrl"].Returns("http://localhost:3000");
        config["Pathora:HotlinePhone"].Returns("1900-1234");

        var eventHandler = new ProviderRejectedTourInstanceEventHandler(tourInstanceRepository, mailRepository, config, logger);
        var notification = new ProviderRejectedTourInstanceEvent(
            tourInstanceId, Guid.NewGuid(), "Supplier Name", "Hotel", "Reject note",
            new List<RejectedActivityInfo> { new(Guid.NewGuid(), 1, "Hotel Room Activity") });

        // Act
        await eventHandler.Handle(notification, CancellationToken.None);

        // Assert
        await mailRepository.Received(1).Add(Arg.Is<MailEntity>(m => m.To == "operator@test.com" && m.Subject.Contains("TI-TEST")), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task EventHandler_OperatorEmailNull_FallsBackToFirstManager_T7()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var tourInstance = CreateTestInstance(tourInstanceId);

        var tour = new TourEntity { Id = Guid.NewGuid(), TourOperator = null };
        tourInstance.Tour = tour;

        var managerUser = new UserEntity { Id = Guid.NewGuid(), Email = "manager@test.com", FullName = "Manager Name" };
        var manager = new TourInstanceManagerEntity
        {
            UserId = managerUser.Id,
            User = managerUser,
            Role = TourInstanceManagerRole.Manager,
            CreatedOnUtc = DateTimeOffset.UtcNow
        };
        tourInstance.Managers.Add(manager);

        var mailRepository = Substitute.For<IMailRepository>();
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var config = Substitute.For<IConfiguration>();
        var logger = Substitute.For<ILogger<ProviderRejectedTourInstanceEventHandler>>();

        tourInstanceRepository.FindByIdForRejectNotification(tourInstanceId, Arg.Any<CancellationToken>()).Returns(tourInstance);
        config["App:BaseUrl"].Returns("http://localhost:3000");
        config["Pathora:HotlinePhone"].Returns("1900-1234");

        var eventHandler = new ProviderRejectedTourInstanceEventHandler(tourInstanceRepository, mailRepository, config, logger);
        var notification = new ProviderRejectedTourInstanceEvent(
            tourInstanceId, Guid.NewGuid(), "Supplier Name", "Hotel", "Reject note",
            new List<RejectedActivityInfo> { new(Guid.NewGuid(), 1, "Hotel Room Activity") });

        // Act
        await eventHandler.Handle(notification, CancellationToken.None);

        // Assert
        await mailRepository.Received(1).Add(Arg.Is<MailEntity>(m => m.To == "manager@test.com"), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task EventHandler_NoRecipient_DoesNotAddMail_T7_2()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var tourInstance = CreateTestInstance(tourInstanceId);

        var tour = new TourEntity { Id = Guid.NewGuid(), TourOperator = null };
        tourInstance.Tour = tour; // No managers added either

        var mailRepository = Substitute.For<IMailRepository>();
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var config = Substitute.For<IConfiguration>();
        var logger = Substitute.For<ILogger<ProviderRejectedTourInstanceEventHandler>>();

        tourInstanceRepository.FindByIdForRejectNotification(tourInstanceId, Arg.Any<CancellationToken>()).Returns(tourInstance);

        var eventHandler = new ProviderRejectedTourInstanceEventHandler(tourInstanceRepository, mailRepository, config, logger);
        var notification = new ProviderRejectedTourInstanceEvent(
            tourInstanceId, Guid.NewGuid(), "Supplier Name", "Hotel", "Reject note",
            new List<RejectedActivityInfo> { new(Guid.NewGuid(), 1, "Hotel Room Activity") });

        // Act
        await eventHandler.Handle(notification, CancellationToken.None);

        // Assert
        await mailRepository.DidNotReceiveWithAnyArgs().Add(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task EventHandler_RepositoryThrowsException_HandlerCatchesWithoutReThrowing_T8()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var tourInstance = CreateTestInstance(tourInstanceId);

        var tourOperator = new UserEntity { Id = Guid.NewGuid(), Email = "operator@test.com", FullName = "Operator Name" };
        var tour = new TourEntity { Id = Guid.NewGuid(), TourOperator = tourOperator };
        tourInstance.Tour = tour;

        var mailRepository = Substitute.For<IMailRepository>();
        var tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        var config = Substitute.For<IConfiguration>();
        var logger = Substitute.For<ILogger<ProviderRejectedTourInstanceEventHandler>>();

        tourInstanceRepository.FindByIdForRejectNotification(tourInstanceId, Arg.Any<CancellationToken>()).Returns(tourInstance);
        mailRepository.Add(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>()).Throws(new Exception("Database connection failure"));

        var eventHandler = new ProviderRejectedTourInstanceEventHandler(tourInstanceRepository, mailRepository, config, logger);
        var notification = new ProviderRejectedTourInstanceEvent(
            tourInstanceId, Guid.NewGuid(), "Supplier Name", "Hotel", "Reject note",
            new List<RejectedActivityInfo> { new(Guid.NewGuid(), 1, "Hotel Room Activity") });

        // Act
        var exception = await Record.ExceptionAsync(() => eventHandler.Handle(notification, CancellationToken.None));

        // Assert
        Assert.Null(exception); // Should not throw
    }

    [Fact]
    public async Task Repository_FindByIdForRejectNotification_LightweightInclusionAssertion_T13()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var instanceId = Guid.NewGuid();
        var operatorId = Guid.NewGuid();
        var managerUserId = Guid.NewGuid();

        using (var context = new AppDbContext(options))
        {
            var tourOperator = new UserEntity { Id = operatorId, Email = "operator@test.com", FullName = "Operator", Username = "operator" };
            var tour = new TourEntity
            {
                Id = Guid.NewGuid(),
                TourName = "TourName",
                ShortDescription = "ShortDescription",
                LongDescription = "LongDescription",
                TourCode = "TourCode",
                TourOperator = tourOperator
            };
            var instance = TourInstanceEntity.Create(
                tourId: tour.Id,
                classificationId: Guid.NewGuid(),
                title: "Title",
                tourName: "TourName",
                tourCode: "TI-001",
                classificationName: "Standard",
                instanceType: TourType.Private,
                startDate: DateTimeOffset.UtcNow,
                endDate: DateTimeOffset.UtcNow.AddDays(1),
                maxParticipation: 10,
                basePrice: 100m,
                performedBy: "tester",
                requiresApproval: false);
            instance.Id = instanceId;
            instance.Tour = tour;

            var managerUser = new UserEntity { Id = managerUserId, Email = "manager@test.com", FullName = "Manager", Username = "manager" };
            var manager = new TourInstanceManagerEntity
            {
                UserId = managerUserId,
                User = managerUser,
                Role = TourInstanceManagerRole.Manager,
                CreatedOnUtc = DateTimeOffset.UtcNow
            };
            instance.Managers.Add(manager);

            context.TourInstances.Add(instance);
            await context.SaveChangesAsync();
        }

        // Act
        using (var context = new AppDbContext(options))
        {
            var repo = new TourInstanceRepository(context);
            var result = await repo.FindByIdForRejectNotification(instanceId);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Tour);
            Assert.NotNull(result.Tour.TourOperator);
            Assert.Equal("operator@test.com", result.Tour.TourOperator.Email);
            Assert.Single(result.Managers);
            Assert.NotNull(result.Managers[0].User);
            Assert.Equal("manager@test.com", result.Managers[0].User.Email);
        }
    }
}
