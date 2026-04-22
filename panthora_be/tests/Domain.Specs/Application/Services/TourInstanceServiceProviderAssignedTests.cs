using Application.Common;
using Application.Common.Interfaces;
using Application.Dtos;
using Application.Services;
using AutoMapper;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
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
            _logger);
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

        _tourInstanceRepository.FindProviderAssigned(supplierId, 1, 10, null, Arg.Any<CancellationToken>())
            .Returns(tourInstances);
        _tourInstanceRepository.CountProviderAssigned(supplierId, null, Arg.Any<CancellationToken>())
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
                "Public",
                1));

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

        // According to the implementation, it uses suppliers[0].Id
        var primarySupplierId = supplier1Id;

        var tourInstances = new List<TourInstanceEntity>
        {
            new() { Id = Guid.NewGuid(), Title = "Combined Tour" }
        };

        _tourInstanceRepository.FindProviderAssigned(primarySupplierId, 1, 10, null, Arg.Any<CancellationToken>())
            .Returns(tourInstances);
        _tourInstanceRepository.CountProviderAssigned(primarySupplierId, null, Arg.Any<CancellationToken>())
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
                "Public",
                1));

        // Act
        var result = await _sut.GetProviderAssigned(1, 10);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(1, result.Value.Total);
        await _supplierRepository.Received(1).FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>());
        await _tourInstanceRepository.Received(1).FindProviderAssigned(primarySupplierId, 1, 10, null, Arg.Any<CancellationToken>());
    }
}
