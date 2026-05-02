#pragma warning disable CS4014
using global::Application.Common.Constant;
using global::Application.Common.Interfaces;
using global::Application.Features.TourInstance.Commands;
using Contracts.Interfaces;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using FluentAssertions;
using NSubstitute;

namespace Domain.Specs.Application.Features.TourInstance.Commands;

public class AssignRoomToAccommodationCommandHandlerTests
{
    private readonly IRoomBlockRepository _mockRoomBlockRepository;
    private readonly IHotelRoomInventoryRepository _mockInventoryRepository;
    private readonly ISupplierRepository _mockSupplierRepository;
    private readonly ITourInstanceRepository _mockTourInstanceRepository;
    private readonly IResourceAvailabilityService _mockAvailabilityService;
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
        _mockAvailabilityService = Substitute.For<IResourceAvailabilityService>();
        _mockUnitOfWork = Substitute.For<IUnitOfWork>();
        _mockUser = Substitute.For<IUser>();

        _mockUser.Id.Returns(_userId.ToString());

        // Default Mock Supplier
        _mockSupplierRepository.FindAllByOwnerUserIdAsync(_userId, Arg.Any<CancellationToken>())
            .Returns([new SupplierEntity { Id = _supplierId, OwnerUserId = _userId }]);

        _handler = new AssignRoomToAccommodationCommandHandler(
            _mockRoomBlockRepository,
            _mockInventoryRepository,
            _mockSupplierRepository,
            _mockTourInstanceRepository,
            _mockAvailabilityService,
            _mockUnitOfWork,
            _mockUser);
    }

    private TourInstanceEntity CreateMockTourInstance(Guid providerId, TourDayActivityType activityType, Guid activityId)
    {
        var activity = new TourInstanceDayActivityEntity { Id = activityId, ActivityType = activityType };

        // For accommodation activities, set supplier on the accommodation entity
        if (activityType == TourDayActivityType.Accommodation)
        {
            activity.Accommodation = new TourInstancePlanAccommodationEntity
            {
                Id = Guid.NewGuid(),
                TourInstanceDayActivityId = activityId,
                SupplierId = providerId,
                SupplierApprovalStatus = ProviderApprovalStatus.Pending
            };
        }

        var day = new TourInstanceDayEntity { Id = Guid.NewGuid(), ActualDate = DateOnly.FromDateTime(DateTime.UtcNow), IsDeleted = false, Activities = new List<TourInstanceDayActivityEntity> { activity } };
        activity.TourInstanceDayId = day.Id;
        activity.TourInstanceDay = day;

        return new TourInstanceEntity
        {
            Id = _instanceId,
            InstanceDays = new List<TourInstanceDayEntity> { day }
        };
    }

    [Fact]
    public async Task Handle_WithValidRequest_ReturnsSuccess()
    {
        var request = new AssignRoomToAccommodationCommand(_instanceId, _activityId, "Standard", 5);
        var instance = CreateMockTourInstance(_supplierId, TourDayActivityType.Accommodation, _activityId);

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        _mockInventoryRepository.FindByHotelAndRoomTypeAsync(_supplierId, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns(new HotelRoomInventoryEntity { TotalRooms = 20 });

        _mockAvailabilityService.CheckRoomAvailabilityAsync(_supplierId, RoomType.Standard, Arg.Any<DateOnly>(), 5, _activityId, Arg.Any<CancellationToken>())
            .Returns(true);

        _mockUnitOfWork.ExecuteTransactionAsync(Arg.Any<Func<Task>>()).Returns(async callInfo =>
        {
            var action = callInfo.Arg<Func<Task>>();
            await action();
        });

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeFalse();
        result.Value.Success.Should().BeTrue();
        result.Value.TotalRooms.Should().Be(20);

        await _mockRoomBlockRepository.Received(1).DeleteByTourInstanceDayActivityIdAsync(_activityId, Arg.Any<CancellationToken>());
        _mockRoomBlockRepository.Received(1).Add(Arg.Is<RoomBlockEntity>(x => x.RoomCountBlocked == 5 && x.RoomType == RoomType.Standard));
    }

    [Fact]
    public async Task Handle_WithInsufficientAvailability_ReturnsValidationError()
    {
        var request = new AssignRoomToAccommodationCommand(_instanceId, _activityId, "Standard", 15);
        var instance = CreateMockTourInstance(_supplierId, TourDayActivityType.Accommodation, _activityId);

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        _mockAvailabilityService.CheckRoomAvailabilityAsync(_supplierId, RoomType.Standard, Arg.Any<DateOnly>(), 15, _activityId, Arg.Any<CancellationToken>())
            .Returns(false);

        var result = await _handler.Handle(request, CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("RoomBlock.InsufficientInventory");
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
    public async Task Handle_WhenRoomTypeIsCaseInsensitive_ParsesSuccessfully()
    {
        var request = new AssignRoomToAccommodationCommand(_instanceId, _activityId, "standard", 5); // lowercase
        var instance = CreateMockTourInstance(_supplierId, TourDayActivityType.Accommodation, _activityId);

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(instance);

        _mockInventoryRepository.FindByHotelAndRoomTypeAsync(_supplierId, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns(new HotelRoomInventoryEntity { TotalRooms = 20 });

        _mockAvailabilityService.CheckRoomAvailabilityAsync(_supplierId, RoomType.Standard, Arg.Any<DateOnly>(), 5, _activityId, Arg.Any<CancellationToken>())
            .Returns(true);

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
