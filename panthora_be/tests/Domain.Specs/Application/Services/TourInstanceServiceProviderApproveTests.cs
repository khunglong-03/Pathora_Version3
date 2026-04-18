#pragma warning disable CS4014
using Application.Common.Constant;
using Application.Services;
using AutoMapper;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace Domain.Specs.Application.Services;

public class TourInstanceServiceProviderApproveTests
{
    private readonly ITourInstanceRepository _mockTourInstanceRepository;
    private readonly ITourInstancePlanRouteRepository _mockRouteRepository;
    private readonly ITourRepository _mockTourRepository;
    private readonly ITourRequestRepository _mockTourRequestRepository;
    private readonly ISupplierRepository _mockSupplierRepository;
    private readonly IMailRepository _mockMailRepository;
    private readonly IRoomBlockRepository _mockRoomBlockRepository;
    private readonly IHotelRoomInventoryRepository _mockHotelRoomInventoryRepository;
    private readonly IUser _mockUser;
    private readonly IMapper _mockMapper;
    private readonly ILogger<TourInstanceService> _mockLogger;
    private readonly ITourInstanceNotificationBroadcaster _mockBroadcaster;
    private readonly TourInstanceService _service;

    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _supplierId = Guid.NewGuid();
    private readonly Guid _instanceId = Guid.NewGuid();

    public TourInstanceServiceProviderApproveTests()
    {
        _mockTourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        _mockRouteRepository = Substitute.For<ITourInstancePlanRouteRepository>();
        _mockTourRepository = Substitute.For<ITourRepository>();
        _mockTourRequestRepository = Substitute.For<ITourRequestRepository>();
        _mockSupplierRepository = Substitute.For<ISupplierRepository>();
        _mockMailRepository = Substitute.For<IMailRepository>();
        _mockRoomBlockRepository = Substitute.For<IRoomBlockRepository>();
        _mockHotelRoomInventoryRepository = Substitute.For<IHotelRoomInventoryRepository>();
        _mockUser = Substitute.For<IUser>();
        _mockMapper = Substitute.For<IMapper>();
        _mockLogger = Substitute.For<ILogger<TourInstanceService>>();
        _mockBroadcaster = Substitute.For<ITourInstanceNotificationBroadcaster>();

        _mockUser.Id.Returns(_userId.ToString());
        _mockSupplierRepository.FindByOwnerUserIdAsync(_userId, Arg.Any<CancellationToken>())
            .Returns(new SupplierEntity { Id = _supplierId, OwnerUserId = _userId });

        _service = new TourInstanceService(
            _mockTourInstanceRepository,
            _mockRouteRepository,
            _mockTourRepository,
            _mockTourRequestRepository,
            _mockSupplierRepository,
            _mockMailRepository,
            _mockRoomBlockRepository,
            _mockHotelRoomInventoryRepository,
            _mockUser,
            _mockMapper,
            _mockLogger,
            _mockBroadcaster);
    }

    [Fact]
    public async Task ProviderApprove_WithTransportAndUnassignedRoutes_ReturnsValidationError()
    {
        var instance = new TourInstanceEntity { Id = _instanceId, TransportProviderId = _supplierId };
        _mockTourInstanceRepository.FindById(_instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(instance);

        var routes = new List<TourInstancePlanRouteEntity>
        {
            new TourInstancePlanRouteEntity { Id = Guid.NewGuid(), VehicleId = null, DriverId = null }, 
            new TourInstancePlanRouteEntity { Id = Guid.NewGuid(), VehicleId = Guid.NewGuid(), DriverId = Guid.NewGuid() }
        };
        _mockRouteRepository.GetByTourInstanceIdAsync(_instanceId, Arg.Any<CancellationToken>())
            .Returns(routes);

        var result = await _service.ProviderApprove(_instanceId, isApproved: true, note: null, providerType: "Transport", CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("TourInstance.RoutesNotAssigned");
        _mockTourInstanceRepository.DidNotReceive().Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ProviderApprove_WithHotelApprove_WhenRoomsNotAllocated_ReturnsValidationError()
    {
        var instance = new TourInstanceEntity { Id = _instanceId, HotelProviderId = _supplierId };
        _mockTourInstanceRepository.FindById(_instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(instance);

        var activityId = Guid.NewGuid();
        var fullInstance = new TourInstanceEntity 
        { 
            Id = _instanceId, 
            HotelProviderId = _supplierId,
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new TourInstanceDayEntity 
                { 
                    IsDeleted = false, 
                    InstanceDayNumber = 1,
                    Activities = new List<TourInstanceDayActivityEntity> 
                    {
                        new TourInstanceDayActivityEntity 
                        {
                            Id = activityId,
                            ActivityType = TourDayActivityType.Accommodation,
                            Accommodation = new TourInstancePlanAccommodationEntity 
                            { 
                                Quantity = 5 // require 5 rooms
                            },
                            TourInstanceDay = new TourInstanceDayEntity { InstanceDayNumber = 1 }
                        }
                    } 
                }
            } 
        };

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(fullInstance);

        // only 2 rooms are blocked instead of 5
        _mockRoomBlockRepository.GetByTourInstanceDayActivityIdsAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new List<RoomBlockEntity> 
            {
                new RoomBlockEntity { TourInstanceDayActivityId = activityId, RoomCountBlocked = 2 }
            });

        var result = await _service.ProviderApprove(_instanceId, isApproved: true, note: null, providerType: "Hotel", CancellationToken.None);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("TourInstance.RoomsNotAllocated");
        result.FirstError.Description.Should().Contain("Ngày 1: cần 5 phòng, đã gán 2");
        _mockTourInstanceRepository.DidNotReceive().Update(Arg.Any<TourInstanceEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ProviderApprove_WithHotelApprove_WhenRoomsAreFullyAllocated_ReturnsSuccess()
    {
        var instance = new TourInstanceEntity { Id = _instanceId, HotelProviderId = _supplierId };
        _mockTourInstanceRepository.FindById(_instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(instance);

        var activityId = Guid.NewGuid();
        var fullInstance = new TourInstanceEntity 
        { 
            Id = _instanceId, 
            HotelProviderId = _supplierId,
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new TourInstanceDayEntity 
                { 
                    IsDeleted = false, 
                    InstanceDayNumber = 1,
                    Activities = new List<TourInstanceDayActivityEntity> 
                    {
                        new TourInstanceDayActivityEntity 
                        {
                            Id = activityId,
                            ActivityType = TourDayActivityType.Accommodation,
                            Accommodation = new TourInstancePlanAccommodationEntity 
                            { 
                                Quantity = 5 // require 5 rooms
                            },
                            TourInstanceDay = new TourInstanceDayEntity { InstanceDayNumber = 1 }
                        }
                    } 
                }
            } 
        };

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(fullInstance);

        _mockRoomBlockRepository.GetByTourInstanceDayActivityIdsAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new List<RoomBlockEntity> 
            {
                new RoomBlockEntity { TourInstanceDayActivityId = activityId, RoomCountBlocked = 5 } // 5 rooms blocked
            });

        var result = await _service.ProviderApprove(_instanceId, isApproved: true, note: null, providerType: "Hotel", CancellationToken.None);

        result.IsError.Should().BeFalse();
        instance.HotelApprovalStatus.Should().Be(ProviderApprovalStatus.Approved);
        _mockTourInstanceRepository.Received(1).Update(instance, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ProviderApprove_WithTransportReject_ReturnsSuccessWithoutCheckingRoutes()
    {
        var instance = new TourInstanceEntity { Id = _instanceId, TransportProviderId = _supplierId };
        _mockTourInstanceRepository.FindById(_instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(instance);

        var result = await _service.ProviderApprove(_instanceId, isApproved: false, note: "Busy", providerType: "Transport", CancellationToken.None);

        result.IsError.Should().BeFalse();
        instance.TransportApprovalStatus.Should().Be(ProviderApprovalStatus.Rejected);
        instance.TransportApprovalNote.Should().Be("Busy");
        await _mockRouteRepository.DidNotReceive().GetByTourInstanceIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        _mockTourInstanceRepository.Received(1).Update(instance, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ProviderApprove_WithHotelReject_ReturnsSuccessWithoutCheckingRoomBlocks()
    {
        var instance = new TourInstanceEntity { Id = _instanceId, HotelProviderId = _supplierId };
        _mockTourInstanceRepository.FindById(_instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(instance);

        var result = await _service.ProviderApprove(_instanceId, isApproved: false, note: "Full", providerType: "Hotel", CancellationToken.None);

        result.IsError.Should().BeFalse();
        instance.HotelApprovalStatus.Should().Be(ProviderApprovalStatus.Rejected);
        await _mockTourInstanceRepository.DidNotReceive().FindByIdWithInstanceDays(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        await _mockRoomBlockRepository.DidNotReceive().GetByTourInstanceDayActivityIdsAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>());
        _mockTourInstanceRepository.Received(1).Update(instance, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ProviderApprove_WithHotelApprove_SoftDeletedDay_Or_ZeroQuantity_AreGracefullySkipped()
    {
        var instance = new TourInstanceEntity { Id = _instanceId, HotelProviderId = _supplierId };
        _mockTourInstanceRepository.FindById(_instanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(instance);

        var deletedDayActivityId = Guid.NewGuid();
        var zeroQuantityActivityId = Guid.NewGuid();
        var nullPlanActivityId = Guid.NewGuid();

        var fullInstance = new TourInstanceEntity 
        { 
            Id = _instanceId, 
            HotelProviderId = _supplierId,
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new TourInstanceDayEntity 
                { 
                    IsDeleted = true, // Deleted
                    InstanceDayNumber = 1,
                    Activities = new List<TourInstanceDayActivityEntity> 
                    {
                        new TourInstanceDayActivityEntity 
                        {
                            Id = deletedDayActivityId,
                            ActivityType = TourDayActivityType.Accommodation,
                            Accommodation = new TourInstancePlanAccommodationEntity { Quantity = 5 }
                        }
                    } 
                },
                new TourInstanceDayEntity 
                { 
                    IsDeleted = false,
                    InstanceDayNumber = 2,
                    Activities = new List<TourInstanceDayActivityEntity> 
                    {
                        new TourInstanceDayActivityEntity 
                        {
                            Id = zeroQuantityActivityId,
                            ActivityType = TourDayActivityType.Accommodation,
                            Accommodation = new TourInstancePlanAccommodationEntity { Quantity = 0 } // 0 quantity
                        },
                        new TourInstanceDayActivityEntity 
                        {
                            Id = nullPlanActivityId,
                            ActivityType = TourDayActivityType.Accommodation,
                            Accommodation = null // null plan
                        }
                    } 
                }
            } 
        };

        _mockTourInstanceRepository.FindByIdWithInstanceDays(_instanceId, Arg.Any<CancellationToken>())
            .Returns(fullInstance);

        _mockRoomBlockRepository.GetByTourInstanceDayActivityIdsAsync(Arg.Any<List<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new List<RoomBlockEntity>());

        var result = await _service.ProviderApprove(_instanceId, isApproved: true, note: null, providerType: "Hotel", CancellationToken.None);

        result.IsError.Should().BeFalse();
        instance.HotelApprovalStatus.Should().Be(ProviderApprovalStatus.Approved);
        _mockTourInstanceRepository.Received(1).Update(instance, Arg.Any<CancellationToken>());
    }
}
