#pragma warning disable CS4014
using Application.Common.Constant;
using Application.Features.TourInstance.Commands;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using FluentAssertions;
using NSubstitute;

namespace Domain.Specs.Application.Features.TourInstance.Commands;

public class AssignRoomToAccommodationCommandHandlerTests
{
    private readonly IRoomBlockRepository _mockRoomBlockRepository;
    private readonly IHotelRoomInventoryRepository _mockInventoryRepository;
    private readonly ISupplierRepository _mockSupplierRepository;
    private readonly ITourInstanceRepository _mockTourInstanceRepository;
    private readonly IUnitOfWork _mockUnitOfWork;
    private readonly IUser _mockUser;
    private readonly AssignRoomToAccommodationCommandHandler _handler;

    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _supplierId = Guid.NewGuid();
    private readonly Guid _instanceId = Guid.NewGuid();
    private readonly Guid _activityId = Guid.NewGuid();

    public AssignRoomToAccommodationCommandHandlerTests()
    {
        _mockRoomBlockRepository = Substitute.For<IRoomBlockRepository>();
        _mockInventoryRepository = Substitute.For<IHotelRoomInventoryRepository>();
        _mockSupplierRepository = Substitute.For<ISupplierRepository>();
        _mockTourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        _mockUnitOfWork = Substitute.For<IUnitOfWork>();
        _mockUser = Substitute.For<IUser>();

        _mockUser.Id.Returns(_userId.ToString());

        // Default Mock Supplier
        _mockSupplierRepository.FindByOwnerUserIdAsync(_userId, Arg.Any<CancellationToken>())
            .Returns(new SupplierEntity { Id = _supplierId, OwnerUserId = _userId });

        _handler = new AssignRoomToAccommodationCommandHandler(
            _mockRoomBlockRepository,
            _mockInventoryRepository,
            _mockSupplierRepository,
            _mockTourInstanceRepository,
            _mockUnitOfWork,
            _mockUser);
    }

    private TourInstanceEntity CreateMockTourInstance(Guid providerId, TourDayActivityType activityType, Guid activityId)
    {
        var activity = new TourInstanceDayActivityEntity { Id = activityId, ActivityType = activityType };
        var day = new TourInstanceDayEntity { Id = Guid.NewGuid(), ActualDate = DateOnly.FromDateTime(DateTime.UtcNow), IsDeleted = false, Activities = new List<TourInstanceDayActivityEntity> { activity } };
        activity.TourInstanceDayId = day.Id;
        activity.TourInstanceDay = day;

        return new TourInstanceEntity
        {
            Id = _instanceId,
            HotelProviderId = providerId,
            InstanceDays = new List<TourInstanceDayEntity> { day }
        };
    }

    [Fact]
    public async Task Handle_WithValidRequest_ReturnsSuccessAndNoWarning()
    {
        var request = new AssignRoomToAccommodationCommand(_instanceId, _activityId, "Standard", 5);
        var instance = CreateMockTourInstance(_supplierId, TourDayActivityType.Accommodation, _activityId);

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        _mockInventoryRepository.FindByHotelAndRoomTypeAsync(_supplierId, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns(new HotelRoomInventoryEntity { TotalRooms = 20 });

        _mockRoomBlockRepository.GetBlockedRoomCountAsync(_supplierId, RoomType.Standard, Arg.Any<DateOnly>(), Arg.Any<CancellationToken>())
            .Returns(10); // 10 already blocked globally on that day

        _mockRoomBlockRepository.GetByTourInstanceDayActivityIdAsync(_activityId, Arg.Any<CancellationToken>())
            .Returns(new List<RoomBlockEntity>()); // none blocked by this activity before

        _mockUnitOfWork.ExecuteTransactionAsync(Arg.Any<Func<Task>>()).Returns(async callInfo =>
        {
            var action = callInfo.Arg<Func<Task>>();
            await action();
        });

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Success.Should().BeTrue();
        result.Value.AvailabilityWarning.Should().BeFalse();
        result.Value.AvailableAfter.Should().Be(5); // 20 - 10 = 10 available, minus 5 requested = 5
        result.Value.TotalRooms.Should().Be(20);

        await _mockRoomBlockRepository.Received(1).DeleteByTourInstanceDayActivityIdAsync(_activityId, Arg.Any<CancellationToken>());
        _mockRoomBlockRepository.Received(1).Add(Arg.Is<RoomBlockEntity>(x => x.RoomCountBlocked == 5 && x.RoomType == RoomType.Standard));
    }

    [Fact]
    public async Task Handle_WithReassignment_CalculatesAvailableCorrectly()
    {
        var request = new AssignRoomToAccommodationCommand(_instanceId, _activityId, "Standard", 8);
        var instance = CreateMockTourInstance(_supplierId, TourDayActivityType.Accommodation, _activityId);

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        _mockInventoryRepository.FindByHotelAndRoomTypeAsync(_supplierId, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns(new HotelRoomInventoryEntity { TotalRooms = 20 });

        _mockRoomBlockRepository.GetBlockedRoomCountAsync(_supplierId, RoomType.Standard, Arg.Any<DateOnly>(), Arg.Any<CancellationToken>())
            .Returns(10); // 10 blocked totally on that day

        // Assuming 3 of those 10 were from this exact activity previously
        _mockRoomBlockRepository.GetByTourInstanceDayActivityIdAsync(_activityId, Arg.Any<CancellationToken>())
            .Returns(new List<RoomBlockEntity> { new RoomBlockEntity { RoomType = RoomType.Standard, RoomCountBlocked = 3 } });

        _mockUnitOfWork.ExecuteTransactionAsync(Arg.Any<Func<Task>>()).Returns(async callInfo =>
        {
            var action = callInfo.Arg<Func<Task>>();
            await action();
        });

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeFalse();
        // 10 total existing blocked, 3 is self -> 7 net blocked by others.
        // 20 total rooms - 7 net = 13 available for this activity.
        // We request 8. 13 - 8 = 5 available after.
        result.Value.AvailableAfter.Should().Be(5);
        result.Value.AvailabilityWarning.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WithValidRequestButInsufficientAvailability_ReturnsWarningButSuccess()
    {
        var request = new AssignRoomToAccommodationCommand(_instanceId, _activityId, "Standard", 15);
        var instance = CreateMockTourInstance(_supplierId, TourDayActivityType.Accommodation, _activityId);

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        _mockInventoryRepository.FindByHotelAndRoomTypeAsync(_supplierId, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns(new HotelRoomInventoryEntity { TotalRooms = 20 });

        _mockRoomBlockRepository.GetBlockedRoomCountAsync(_supplierId, RoomType.Standard, Arg.Any<DateOnly>(), Arg.Any<CancellationToken>())
            .Returns(10);

        _mockRoomBlockRepository.GetByTourInstanceDayActivityIdAsync(_activityId, Arg.Any<CancellationToken>())
            .Returns(new List<RoomBlockEntity>());

        _mockUnitOfWork.ExecuteTransactionAsync(Arg.Any<Func<Task>>()).Returns(async callInfo =>
        {
            var action = callInfo.Arg<Func<Task>>();
            await action();
        });

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Success.Should().BeTrue();
        result.Value.AvailabilityWarning.Should().BeTrue(); // Requested 15 but only 10 available
    }

    [Fact]
    public async Task Handle_WhenActivityNotAccommodation_ReturnsValidationError()
    {
        var request = new AssignRoomToAccommodationCommand(_instanceId, _activityId, "Standard", 5);
        var instance = CreateMockTourInstance(_supplierId, TourDayActivityType.Dining, _activityId); // Not accommodation

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("TourInstanceActivity.InvalidType");
    }

    [Fact]
    public async Task Handle_WhenTourProviderMismatch_ReturnsValidationError()
    {
        var request = new AssignRoomToAccommodationCommand(_instanceId, _activityId, "Standard", 5);
        var instance = CreateMockTourInstance(Guid.NewGuid(), TourDayActivityType.Accommodation, _activityId); // Mismatch provider

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("TourInstance.ProviderNotAssigned");
    }

    [Fact]
    public async Task Handle_WhenRoomTypeNotInInventory_ReturnsValidationError()
    {
        var request = new AssignRoomToAccommodationCommand(_instanceId, _activityId, "Suite", 5);
        var instance = CreateMockTourInstance(_supplierId, TourDayActivityType.Accommodation, _activityId);

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        _mockInventoryRepository.FindByHotelAndRoomTypeAsync(_supplierId, RoomType.Suite, Arg.Any<CancellationToken>())
            .Returns((HotelRoomInventoryEntity)null!); // Missing in inventory

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Inventory.NotFound");
    }

    [Fact]
    public async Task Handle_WhenRoomTypeIsCaseInsensitive_ParsesSuccessfully()
    {
        var request = new AssignRoomToAccommodationCommand(_instanceId, _activityId, "standard", 5); // lowercase
        var instance = CreateMockTourInstance(_supplierId, TourDayActivityType.Accommodation, _activityId);

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        _mockInventoryRepository.FindByHotelAndRoomTypeAsync(_supplierId, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns(new HotelRoomInventoryEntity { TotalRooms = 20 });

        _mockRoomBlockRepository.GetByTourInstanceDayActivityIdAsync(_activityId, Arg.Any<CancellationToken>())
            .Returns(new List<RoomBlockEntity>());

        _mockUnitOfWork.ExecuteTransactionAsync(Arg.Any<Func<Task>>()).Returns(async callInfo =>
        {
            var action = callInfo.Arg<Func<Task>>();
            await action();
        });

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Success.Should().BeTrue();
    }
}
