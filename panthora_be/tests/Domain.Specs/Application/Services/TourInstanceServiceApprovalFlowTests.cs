using Application.Features.TourInstance.Commands;
using Application.Services;
using AutoMapper;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Mails;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace Domain.Specs.Application.Services;

public sealed class TourInstanceServiceApprovalFlowTests
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

    [Fact]
    public async Task AssignSupplier_ThenApproveHotel_TransitionsInstanceToAvailable()
    {
        var ownerUserId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var instance = CreatePendingApprovalInstance();
        var accommodationActivityId = instance.InstanceDays
            .SelectMany(day => day.Activities)
            .Single(activity => activity.ActivityType == TourDayActivityType.Accommodation)
            .Id;

        var supplier = new SupplierEntity
        {
            Id = supplierId,
            SupplierCode = "HOTEL-001",
            SupplierType = SupplierType.Accommodation,
            Name = "Hotel Alpha",
            OwnerUserId = ownerUserId
        };

        _user.Id.Returns(ownerUserId.ToString());
        _supplierRepository.GetByIdAsync(supplierId, Arg.Any<CancellationToken>()).Returns(supplier);
        _supplierRepository.FindAllByOwnerUserIdAsync(ownerUserId, Arg.Any<CancellationToken>()).Returns([supplier]);
        _tourInstanceRepository.FindByIdWithInstanceDays(instance.Id, Arg.Any<CancellationToken>()).Returns(instance);
        _tourInstanceRepository.FindById(instance.Id, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);
        _roomBlockRepository.GetByTourInstanceDayActivityIdsAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(Array.Empty<RoomBlockEntity>());

        var assignHandler = new AssignAccommodationSupplierCommandHandler(
            _tourInstanceRepository,
            _supplierRepository,
            _roomBlockRepository,
            _user);

        var service = new TourInstanceService(
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
            NullLogger<TourInstanceService>.Instance,
            _notificationBroadcaster);

        var assignResult = await assignHandler.Handle(
            new AssignAccommodationSupplierCommand(instance.Id, accommodationActivityId, supplierId),
            CancellationToken.None);

        Assert.False(assignResult.IsError);
        Assert.Equal(supplierId, instance.InstanceDays[0].Activities[0].Accommodation?.SupplierId);
        Assert.Equal(ProviderApprovalStatus.Pending, instance.InstanceDays[0].Activities[0].Accommodation?.SupplierApprovalStatus);
        Assert.Equal(TourInstanceStatus.PendingApproval, instance.Status);

        // Seed a matching room block so ProviderApprove's rooms-allocated gate passes.
        var seededBlock = RoomBlockEntity.Create(
            supplierId: supplierId,
            roomType: RoomType.Standard,
            blockedDate: instance.InstanceDays[0].ActualDate,
            roomCountBlocked: 1,
            performedBy: ownerUserId.ToString(),
            tourInstanceDayActivityId: accommodationActivityId,
            holdStatus: HoldStatus.Hard);
        _roomBlockRepository.GetByTourInstanceDayActivityIdsAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new[] { seededBlock });

        var approveResult = await service.ProviderApprove(
            instance.Id,
            true,
            "approved",
            "Hotel",
            [accommodationActivityId],
            cancellationToken: CancellationToken.None);

        Assert.False(approveResult.IsError);
        Assert.Equal(ProviderApprovalStatus.Approved, instance.InstanceDays[0].Activities[0].Accommodation?.SupplierApprovalStatus);
        Assert.Equal(TourInstanceStatus.Available, instance.Status);
        await _tourInstanceRepository.Received().Update(instance, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ProviderApprove_HotelOwnerWithMultipleSuppliers_SendsGroupedApprovalNotification()
    {
        var ownerUserId = Guid.NewGuid();
        var supplierAlphaId = Guid.NewGuid();
        var supplierBetaId = Guid.NewGuid();
        var instance = CreatePendingApprovalInstance();

        var secondAccommodationActivity = TourInstanceDayActivityEntity.Create(
            instance.InstanceDays[0].Id,
            2,
            TourDayActivityType.Accommodation,
            "Hotel Night 2",
            "tester");
        secondAccommodationActivity.Accommodation = TourInstancePlanAccommodationEntity.Create(
            secondAccommodationActivity.Id,
            RoomType.Deluxe,
            1,
            supplierId: supplierBetaId);
        secondAccommodationActivity.TourInstanceDay = instance.InstanceDays[0];
        instance.InstanceDays[0].Activities.Add(secondAccommodationActivity);
        instance.InstanceDays[0].Activities[0].Accommodation!.AssignSupplier(supplierAlphaId);

        var supplierAlpha = new SupplierEntity
        {
            Id = supplierAlphaId,
            SupplierCode = "HOTEL-001",
            SupplierType = SupplierType.Accommodation,
            Name = "Hotel Alpha",
            OwnerUserId = ownerUserId
        };
        var supplierBeta = new SupplierEntity
        {
            Id = supplierBetaId,
            SupplierCode = "HOTEL-002",
            SupplierType = SupplierType.Accommodation,
            Name = "Hotel Beta",
            OwnerUserId = ownerUserId
        };

        _user.Id.Returns(ownerUserId.ToString());
        _supplierRepository.FindAllByOwnerUserIdAsync(ownerUserId, Arg.Any<CancellationToken>())
            .Returns([supplierAlpha, supplierBeta]);
        _tourInstanceRepository.FindById(instance.Id, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(instance);
        _tourInstanceRepository.FindByIdWithInstanceDays(instance.Id, Arg.Any<CancellationToken>()).Returns(instance);
        // Seed matching room blocks for both activities so rooms-allocated gate passes.
        var actId1 = instance.InstanceDays[0].Activities[0].Id;
        var actId2 = secondAccommodationActivity.Id;
        _roomBlockRepository.GetByTourInstanceDayActivityIdsAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new[]
            {
                RoomBlockEntity.Create(supplierAlphaId, RoomType.Standard, instance.InstanceDays[0].ActualDate, 1, ownerUserId.ToString(), tourInstanceDayActivityId: actId1, holdStatus: HoldStatus.Hard),
                RoomBlockEntity.Create(supplierBetaId, RoomType.Deluxe, instance.InstanceDays[0].ActualDate, 1, ownerUserId.ToString(), tourInstanceDayActivityId: actId2, holdStatus: HoldStatus.Hard)
            });

        var service = new TourInstanceService(
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
            NullLogger<TourInstanceService>.Instance,
            _notificationBroadcaster);

        var result = await service.ProviderApprove(
            instance.Id,
            true,
            "approved",
            "Hotel",
            [
                instance.InstanceDays[0].Activities[0].Id,
                secondAccommodationActivity.Id
            ],
            cancellationToken: CancellationToken.None);

        Assert.False(result.IsError);
        await _notificationBroadcaster.Received().NotifyProviderApprovalResultAsync(
            instance.Id,
            "Hotel properties: Hotel Alpha, Hotel Beta",
            true,
            "approved",
            instance.CreatedBy ?? "tester",
            Arg.Any<CancellationToken>());
    }

    private static TourInstanceEntity CreatePendingApprovalInstance()
    {
        // Manager's user id — must parse as Guid since prod NotifyProviderApprovalResultAsync
        // short-circuits on non-Guid CreatedBy.
        var managerUserId = Guid.NewGuid().ToString();
        var instance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Hotel Approval Flow",
            tourName: "Hotel Approval Flow",
            tourCode: "TI-APPROVAL",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow.Date,
            endDate: DateTimeOffset.UtcNow.Date.AddDays(1),
            maxParticipation: 10,
            basePrice: 100m,
            performedBy: managerUserId,
            transportProviderId: Guid.NewGuid());

        instance.Status = TourInstanceStatus.PendingApproval;

        var day = TourInstanceDayEntity.Create(
            instance.Id,
            Guid.NewGuid(),
            1,
            DateOnly.FromDateTime(DateTime.UtcNow.Date),
            "Day 1",
            "tester");

        var accommodationActivity = TourInstanceDayActivityEntity.Create(
            day.Id,
            1,
            TourDayActivityType.Accommodation,
            "Hotel Night",
            "tester");
        accommodationActivity.Accommodation = TourInstancePlanAccommodationEntity.Create(
            accommodationActivity.Id,
            RoomType.Standard,
            1);
        // Wire parent navigation — prod code reads activity.TourInstanceDay.
        accommodationActivity.TourInstanceDay = day;

        day.Activities.Add(accommodationActivity);
        instance.InstanceDays.Add(day);

        return instance;
    }
}
