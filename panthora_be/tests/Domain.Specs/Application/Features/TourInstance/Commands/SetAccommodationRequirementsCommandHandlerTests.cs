using global::Application.Features.TourInstance.Commands;
using Contracts.Interfaces;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using FluentAssertions;
using NSubstitute;

namespace Domain.Specs.Application.Features.TourInstance.Commands;

public sealed class SetAccommodationRequirementsCommandHandlerTests
{
    private readonly IRoomBlockRepository _roomBlockRepository = Substitute.For<IRoomBlockRepository>();
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IUser _user = Substitute.For<IUser>();

    public SetAccommodationRequirementsCommandHandlerTests()
    {
        _user.Id.Returns(Guid.NewGuid().ToString());
        _user.Roles.Returns(new[] { "TourOperator" });

        _unitOfWork.ExecuteTransactionAsync(Arg.Any<Func<Task>>()).Returns(async callInfo =>
        {
            var action = callInfo.Arg<Func<Task>>();
            await action();
        });
    }

    [Fact]
    public async Task Handle_WhenAccommodationDetailsAreMissing_CreatesPlanAccommodationAndSavesRequirements()
    {
        var instanceId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var instance = CreateInstanceWithAccommodationActivity(instanceId, activityId);
        var activity = instance.InstanceDays[0].Activities[0];

        _tourInstanceRepository
            .FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);
        _tourInstanceRepository
            .FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        var handler = CreateHandler();
        var result = await handler.Handle(
            new SetAccommodationRequirementsCommand(instanceId, activityId, supplierId, "Double", 2),
            CancellationToken.None);

        result.IsError.Should().BeFalse();
        activity.Accommodation.Should().NotBeNull();
        activity.Accommodation!.TourInstanceDayActivityId.Should().Be(activityId);
        activity.Accommodation.SupplierId.Should().Be(supplierId);
        activity.Accommodation.RoomType.Should().Be(RoomType.Double);
        activity.Accommodation.Quantity.Should().Be(2);
        activity.Accommodation.SupplierApprovalStatus.Should().Be(ProviderApprovalStatus.Pending);
        activity.Accommodation.SupplierApprovalNote.Should().BeNull();

        await _tourInstanceRepository
            .Received(1)
            .FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>());
        await _roomBlockRepository
            .Received(1)
            .DeleteByTourInstanceDayActivityIdAsync(activityId, Arg.Any<CancellationToken>());
        await _tourInstanceRepository.Received(1).Update(instance, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenAccommodationDetailsExist_PreservesCheckInAndCheckOutTimes()
    {
        var instanceId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var checkInTime = new DateTimeOffset(2026, 5, 3, 14, 0, 0, TimeSpan.Zero);
        var checkOutTime = new DateTimeOffset(2026, 5, 4, 11, 0, 0, TimeSpan.Zero);
        var instance = CreateInstanceWithAccommodationActivity(instanceId, activityId);
        var activity = instance.InstanceDays[0].Activities[0];
        activity.Accommodation = TourInstancePlanAccommodationEntity.Create(
            activityId,
            RoomType.Standard,
            1,
            checkInTime,
            checkOutTime);

        _tourInstanceRepository
            .FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        var handler = CreateHandler();
        var result = await handler.Handle(
            new SetAccommodationRequirementsCommand(instanceId, activityId, supplierId, "Twin", 3),
            CancellationToken.None);

        result.IsError.Should().BeFalse();
        activity.Accommodation!.CheckInTime.Should().Be(checkInTime);
        activity.Accommodation.CheckOutTime.Should().Be(checkOutTime);
        activity.Accommodation.SupplierId.Should().Be(supplierId);
        activity.Accommodation.RoomType.Should().Be(RoomType.Twin);
        activity.Accommodation.Quantity.Should().Be(3);
    }

    [Fact]
    public async Task Handle_WhenOnlyRoomTypeOrQuantityChanges_ResetsSupplierApprovalStatusToPending()
    {
        var instanceId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var instance = CreateInstanceWithAccommodationActivity(instanceId, activityId);
        var activity = instance.InstanceDays[0].Activities[0];

        // Initialize existing accommodation with Approved status
        activity.Accommodation = TourInstancePlanAccommodationEntity.Create(
            activityId,
            RoomType.Standard,
            1,
            null,
            null);
        activity.Accommodation.SupplierId = supplierId;
        activity.Accommodation.SupplierApprovalStatus = ProviderApprovalStatus.Approved;

        _tourInstanceRepository
            .FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        var handler = CreateHandler();

        // Change quantity to 2, keep same supplier and room type
        var result = await handler.Handle(
            new SetAccommodationRequirementsCommand(instanceId, activityId, supplierId, "Standard", 2),
            CancellationToken.None);

        result.IsError.Should().BeFalse();
        activity.Accommodation.Quantity.Should().Be(2);

        // The bug: If status is still Approved, this will fail! It SHOULD be Pending.
        activity.Accommodation.SupplierApprovalStatus.Should().Be(ProviderApprovalStatus.Pending);
    }

    [Fact]
    public async Task Handle_WhenOnlyRoomRequirementsSetWithoutSupplier_SetsApprovalStatusToNotAssigned()
    {
        var instanceId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var instance = CreateInstanceWithAccommodationActivity(instanceId, activityId);
        var activity = instance.InstanceDays[0].Activities[0];

        _tourInstanceRepository
            .FindByIdWithInstanceDaysForUpdate(instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        var handler = CreateHandler();

        // Command with null SupplierId
        var result = await handler.Handle(
            new SetAccommodationRequirementsCommand(instanceId, activityId, null, "Standard", 2),
            CancellationToken.None);

        result.IsError.Should().BeFalse();
        activity.Accommodation.Should().NotBeNull();
        activity.Accommodation!.Quantity.Should().Be(2);
        activity.Accommodation.SupplierId.Should().BeNull();
        activity.Accommodation.SupplierApprovalStatus.Should().Be(ProviderApprovalStatus.NotAssigned);
    }

    private SetAccommodationRequirementsCommandHandler CreateHandler()
    {
        return new SetAccommodationRequirementsCommandHandler(
            _roomBlockRepository,
            _tourInstanceRepository,
            _user);
    }

    private static TourInstanceEntity CreateInstanceWithAccommodationActivity(Guid instanceId, Guid activityId)
    {
        var day = new TourInstanceDayEntity
        {
            Id = Guid.NewGuid(),
            ActualDate = new DateOnly(2026, 5, 3),
            IsDeleted = false
        };
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id,
            1,
            TourDayActivityType.Accommodation,
            "Hotel",
            "tester");
        activity.Id = activityId;
        activity.TourInstanceDay = day;
        activity.TourInstanceDayId = day.Id;
        day.Activities = [activity];

        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            InstanceDays = [day]
        };
        day.TourInstance = instance;
        day.TourInstanceId = instanceId;

        return instance;
    }
}
