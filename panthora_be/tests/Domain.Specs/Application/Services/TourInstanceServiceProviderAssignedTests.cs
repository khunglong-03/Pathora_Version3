using global::Application.Common;
using global::Application.Common.Interfaces;
using global::Application.Dtos;
using global::Application.Services;
using AutoMapper;
using Contracts.Interfaces;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Services;

public class TourInstanceServiceProviderAssignedTests
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
    private readonly ILogger<TourInstanceService> _logger = Substitute.For<ILogger<TourInstanceService>>();
    private readonly ICloudinaryService _cloudinaryService = Substitute.For<ICloudinaryService>();

    private readonly TourInstanceService _sut;

    public TourInstanceServiceProviderAssignedTests()
    {
        _sut = new TourInstanceService(
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
            _logger,
            _cloudinaryService);
    }

    [Fact]
    public async Task GetProviderAssigned_ReturnsEmpty_WhenNoSuppliersExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity>());

        // Act
        var result = await _sut.GetProviderAssigned(1, 10);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(0, result.Value.Total);
        Assert.Empty(result.Value.Items);
    }

    [Fact]
    public async Task GetProviderAssigned_ReturnsTours_WhenSuppliersExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());

        var suppliers = new List<SupplierEntity>
        {
            new() { Id = supplierId, Name = "Test Supplier", OwnerUserId = userId }
        };
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(suppliers);

        var tourInstances = new List<TourInstanceEntity>
        {
            new() { Id = Guid.NewGuid(), Title = "Tour 1" }
        };

        _tourInstanceRepository.FindProviderAssigned(Arg.Is<IEnumerable<Guid>>(ids => ids.Contains(supplierId)), 1, 10, null, Arg.Any<CancellationToken>())
            .Returns(tourInstances);
        _tourInstanceRepository.CountProviderAssigned(Arg.Is<IEnumerable<Guid>>(ids => ids.Contains(supplierId)), null, Arg.Any<CancellationToken>())
            .Returns(1);

        _mapper.Map<TourInstanceVm>(Arg.Any<TourInstanceEntity>())
            .Returns(new TourInstanceVm(
                tourInstances[0].Id,
                Guid.NewGuid(),
                "TIC-001",
                "Tour 1",
                "Tour Name",
                "TC-001",
                "Standard",
                null,
                null,
                [],
                DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow.AddDays(1),
                1,
                0,
                10,
                1000,
                "Available",
                false,
                null,
                "Public"));

        // Act
        var result = await _sut.GetProviderAssigned(1, 10);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(1, result.Value.Total);
        Assert.Single(result.Value.Items);
        Assert.Equal("Tour 1", result.Value.Items[0].Title);
    }

    [Fact]
    public async Task GetProviderAssigned_HandlesMultipleSuppliersCorrectly()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var supplier1Id = Guid.NewGuid();
        var supplier2Id = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());

        var suppliers = new List<SupplierEntity>
        {
            new() { Id = supplier1Id, Name = "Supplier 1", OwnerUserId = userId },
            new() { Id = supplier2Id, Name = "Supplier 2", OwnerUserId = userId }
        };
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(suppliers);

        var tourInstances = new List<TourInstanceEntity>
        {
            new() { Id = Guid.NewGuid(), Title = "Combined Tour" }
        };

        _tourInstanceRepository.FindProviderAssigned(Arg.Is<IEnumerable<Guid>>(ids => ids.Contains(supplier1Id) && ids.Contains(supplier2Id)), 1, 10, null, Arg.Any<CancellationToken>())
            .Returns(tourInstances);
        _tourInstanceRepository.CountProviderAssigned(Arg.Is<IEnumerable<Guid>>(ids => ids.Contains(supplier1Id) && ids.Contains(supplier2Id)), null, Arg.Any<CancellationToken>())
            .Returns(1);

        _mapper.Map<TourInstanceVm>(Arg.Any<TourInstanceEntity>())
            .Returns(new TourInstanceVm(
                tourInstances[0].Id,
                Guid.NewGuid(),
                "TIC-002",
                "Combined Tour",
                "Tour Name",
                "TC-001",
                "Standard",
                null,
                null,
                [],
                DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow.AddDays(1),
                1,
                0,
                10,
                1000,
                "Available",
                false,
                null,
                "Public"));

        // Act
        var result = await _sut.GetProviderAssigned(1, 10);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(1, result.Value.Total);
        await _supplierRepository.Received(1).FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>());
        await _tourInstanceRepository.Received(1).FindProviderAssigned(Arg.Is<IEnumerable<Guid>>(ids => ids.Contains(supplier1Id) && ids.Contains(supplier2Id)), 1, 10, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetProviderAssigned_HotelProvider_OnlySeesAccommodationActivity()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var hotelSupplierId = Guid.NewGuid();
        var transportSupplierId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());

        var suppliers = new List<SupplierEntity>
        {
            new() { Id = hotelSupplierId, Name = "S-Hotel", OwnerUserId = userId }
        };
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(suppliers);

        var tourInstance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            Title = "Tour T",
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    InstanceDayNumber = 1,
                    ActualDate = DateOnly.FromDateTime(DateTime.Today),
                    Activities = new List<TourInstanceDayActivityEntity>
                    {
                        new()
                        {
                            Id = Guid.NewGuid(),
                            ActivityType = TourDayActivityType.Accommodation,
                            Accommodation = new TourInstancePlanAccommodationEntity
                            {
                                SupplierId = hotelSupplierId,
                                Supplier = new SupplierEntity { Name = "S-Hotel" },
                                SupplierApprovalStatus = ProviderApprovalStatus.Pending
                            }
                        },
                        new()
                        {
                            Id = Guid.NewGuid(),
                            ActivityType = TourDayActivityType.Transportation,
                            TransportSupplierId = transportSupplierId,
                            TransportSupplier = new SupplierEntity { Name = "S-Trans" },
                            TransportationApprovalStatus = ProviderApprovalStatus.Pending
                        }
                    }
                }
            }
        };

        _tourInstanceRepository.FindProviderAssigned(Arg.Any<IEnumerable<Guid>>(), 1, 10, null, Arg.Any<CancellationToken>())
            .Returns(new List<TourInstanceEntity> { tourInstance });
        _tourInstanceRepository.CountProviderAssigned(Arg.Any<IEnumerable<Guid>>(), null, Arg.Any<CancellationToken>())
            .Returns(1);

        _mapper.Map<TourInstanceVm>(Arg.Any<TourInstanceEntity>())
            .Returns(new TourInstanceVm(
                tourInstance.Id,
                Guid.NewGuid(),
                "TIC-001",
                "Tour T",
                "Tour Name",
                "TC-001",
                "Standard",
                null,
                null,
                [],
                DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow.AddDays(1),
                1,
                0,
                10,
                1000,
                "Available",
                false,
                null,
                "Public"));

        // Act
        var result = await _sut.GetProviderAssigned(1, 10);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        var activities = result.Value.Items[0].AssignedActivities;
        Assert.NotNull(activities);
        Assert.Single(activities);
        Assert.Equal(TourDayActivityType.Accommodation, activities[0].ActivityType);
        Assert.Equal(hotelSupplierId, activities[0].SupplierId);
    }

    [Fact]
    public async Task GetProviderAssigned_TransportProvider_OnlySeesTransportActivity()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var hotelSupplierId = Guid.NewGuid();
        var transportSupplierId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());

        var suppliers = new List<SupplierEntity>
        {
            new() { Id = transportSupplierId, Name = "S-Trans", OwnerUserId = userId }
        };
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(suppliers);

        var tourInstance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            Title = "Tour T",
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    InstanceDayNumber = 1,
                    ActualDate = DateOnly.FromDateTime(DateTime.Today),
                    Activities = new List<TourInstanceDayActivityEntity>
                    {
                        new()
                        {
                            Id = Guid.NewGuid(),
                            ActivityType = TourDayActivityType.Accommodation,
                            Accommodation = new TourInstancePlanAccommodationEntity
                            {
                                SupplierId = hotelSupplierId,
                                Supplier = new SupplierEntity { Name = "S-Hotel" },
                                SupplierApprovalStatus = ProviderApprovalStatus.Pending
                            }
                        },
                        new()
                        {
                            Id = Guid.NewGuid(),
                            ActivityType = TourDayActivityType.Transportation,
                            TransportSupplierId = transportSupplierId,
                            TransportSupplier = new SupplierEntity { Name = "S-Trans" },
                            TransportationApprovalStatus = ProviderApprovalStatus.Pending
                        }
                    }
                }
            }
        };

        _tourInstanceRepository.FindProviderAssigned(Arg.Any<IEnumerable<Guid>>(), 1, 10, null, Arg.Any<CancellationToken>())
            .Returns(new List<TourInstanceEntity> { tourInstance });
        _tourInstanceRepository.CountProviderAssigned(Arg.Any<IEnumerable<Guid>>(), null, Arg.Any<CancellationToken>())
            .Returns(1);

        _mapper.Map<TourInstanceVm>(Arg.Any<TourInstanceEntity>())
            .Returns(new TourInstanceVm(
                tourInstance.Id,
                Guid.NewGuid(),
                "TIC-001",
                "Tour T",
                "Tour Name",
                "TC-001",
                "Standard",
                null,
                null,
                [],
                DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow.AddDays(1),
                1,
                0,
                10,
                1000,
                "Available",
                false,
                null,
                "Public"));

        // Act
        var result = await _sut.GetProviderAssigned(1, 10);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        var activities = result.Value.Items[0].AssignedActivities;
        Assert.NotNull(activities);
        Assert.Single(activities);
        Assert.Equal(TourDayActivityType.Transportation, activities[0].ActivityType);
        Assert.Equal(transportSupplierId, activities[0].SupplierId);
    }

    [Fact]
    public async Task GetProviderAssigned_DualProvider_SeesBothActivities()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var hotelSupplierId = Guid.NewGuid();
        var transportSupplierId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());

        var suppliers = new List<SupplierEntity>
        {
            new() { Id = hotelSupplierId, Name = "S-Hotel", OwnerUserId = userId },
            new() { Id = transportSupplierId, Name = "S-Trans", OwnerUserId = userId }
        };
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(suppliers);

        var tourInstance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            Title = "Tour T",
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    InstanceDayNumber = 1,
                    ActualDate = DateOnly.FromDateTime(DateTime.Today),
                    Activities = new List<TourInstanceDayActivityEntity>
                    {
                        new()
                        {
                            Id = Guid.NewGuid(),
                            ActivityType = TourDayActivityType.Accommodation,
                            Accommodation = new TourInstancePlanAccommodationEntity
                            {
                                SupplierId = hotelSupplierId,
                                Supplier = new SupplierEntity { Name = "S-Hotel" },
                                SupplierApprovalStatus = ProviderApprovalStatus.Pending
                            }
                        },
                        new()
                        {
                            Id = Guid.NewGuid(),
                            ActivityType = TourDayActivityType.Transportation,
                            TransportSupplierId = transportSupplierId,
                            TransportSupplier = new SupplierEntity { Name = "S-Trans" },
                            TransportationApprovalStatus = ProviderApprovalStatus.Pending
                        }
                    }
                }
            }
        };

        _tourInstanceRepository.FindProviderAssigned(Arg.Any<IEnumerable<Guid>>(), 1, 10, null, Arg.Any<CancellationToken>())
            .Returns(new List<TourInstanceEntity> { tourInstance });
        _tourInstanceRepository.CountProviderAssigned(Arg.Any<IEnumerable<Guid>>(), null, Arg.Any<CancellationToken>())
            .Returns(1);

        _mapper.Map<TourInstanceVm>(Arg.Any<TourInstanceEntity>())
            .Returns(new TourInstanceVm(
                tourInstance.Id,
                Guid.NewGuid(),
                "TIC-001",
                "Tour T",
                "Tour Name",
                "TC-001",
                "Standard",
                null,
                null,
                [],
                DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow.AddDays(1),
                1,
                0,
                10,
                1000,
                "Available",
                false,
                null,
                "Public"));

        // Act
        var result = await _sut.GetProviderAssigned(1, 10);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        var activities = result.Value.Items[0].AssignedActivities;
        Assert.NotNull(activities);
        Assert.Equal(2, activities.Count);
    }

    [Fact]
    public async Task GetProviderAssigned_FilterPending_ExcludesApprovedAndFiltersTour()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var hotelSupplierId = Guid.NewGuid();
        var transportSupplierId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());

        var suppliers = new List<SupplierEntity>
        {
            new() { Id = hotelSupplierId, Name = "S-Hotel", OwnerUserId = userId },
            new() { Id = transportSupplierId, Name = "S-Trans", OwnerUserId = userId }
        };
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(suppliers);

        var tourInstance1 = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            Title = "Tour 1",
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    InstanceDayNumber = 1,
                    ActualDate = DateOnly.FromDateTime(DateTime.Today),
                    Activities = new List<TourInstanceDayActivityEntity>
                    {
                        new()
                        {
                            Id = Guid.NewGuid(),
                            ActivityType = TourDayActivityType.Accommodation,
                            Accommodation = new TourInstancePlanAccommodationEntity
                            {
                                SupplierId = hotelSupplierId,
                                Supplier = new SupplierEntity { Name = "S-Hotel" },
                                SupplierApprovalStatus = ProviderApprovalStatus.Approved
                            }
                        },
                        new()
                        {
                            Id = Guid.NewGuid(),
                            ActivityType = TourDayActivityType.Transportation,
                            TransportSupplierId = transportSupplierId,
                            TransportSupplier = new SupplierEntity { Name = "S-Trans" },
                            TransportationApprovalStatus = ProviderApprovalStatus.Pending
                        }
                    }
                }
            }
        };

        var tourInstance2 = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            Title = "Tour 2",
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    InstanceDayNumber = 1,
                    ActualDate = DateOnly.FromDateTime(DateTime.Today),
                    Activities = new List<TourInstanceDayActivityEntity>
                    {
                        new()
                        {
                            Id = Guid.NewGuid(),
                            ActivityType = TourDayActivityType.Accommodation,
                            Accommodation = new TourInstancePlanAccommodationEntity
                            {
                                SupplierId = hotelSupplierId,
                                Supplier = new SupplierEntity { Name = "S-Hotel" },
                                SupplierApprovalStatus = ProviderApprovalStatus.Approved
                            }
                        }
                    }
                }
            }
        };

        _tourInstanceRepository.FindProviderAssigned(Arg.Any<IEnumerable<Guid>>(), 1, 10, ProviderApprovalStatus.Pending, Arg.Any<CancellationToken>())
            .Returns(new List<TourInstanceEntity> { tourInstance1, tourInstance2 });
        _tourInstanceRepository.CountProviderAssigned(Arg.Any<IEnumerable<Guid>>(), ProviderApprovalStatus.Pending, Arg.Any<CancellationToken>())
            .Returns(2);

        _mapper.Map<TourInstanceVm>(tourInstance1)
            .Returns(new TourInstanceVm(
                tourInstance1.Id,
                Guid.NewGuid(),
                "TIC-001",
                "Tour 1",
                "Tour Name",
                "TC-001",
                "Standard",
                null,
                null,
                [],
                DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow.AddDays(1),
                1,
                0,
                10,
                1000,
                "Available",
                false,
                null,
                "Public"));

        _mapper.Map<TourInstanceVm>(tourInstance2)
            .Returns(new TourInstanceVm(
                tourInstance2.Id,
                Guid.NewGuid(),
                "TIC-002",
                "Tour 2",
                "Tour Name",
                "TC-002",
                "Standard",
                null,
                null,
                [],
                DateTimeOffset.UtcNow,
                DateTimeOffset.UtcNow.AddDays(1),
                1,
                0,
                10,
                1000,
                "Available",
                false,
                null,
                "Public"));

        // Act
        var result = await _sut.GetProviderAssigned(1, 10, ProviderApprovalStatus.Pending);

        // Assert
        Assert.False(result.IsError);
        // Tour 2 only has Approved accommodation, so in-memory filtering leaves it with 0 AssignedActivities, meaning it should be skipped.
        // Tour 1 has 1 Approved and 1 Pending. The Approved is filtered out, but the Pending is kept, so Tour 1 has 1 AssignedActivity.
        Assert.Single(result.Value.Items);
        Assert.Equal(tourInstance1.Id, result.Value.Items[0].Id);
        var activities = result.Value.Items[0].AssignedActivities;
        Assert.NotNull(activities);
        Assert.Single(activities);
        Assert.Equal(TourDayActivityType.Transportation, activities[0].ActivityType);
        Assert.Equal(ProviderApprovalStatus.Pending, activities[0].ApprovalStatus);
    }
}
