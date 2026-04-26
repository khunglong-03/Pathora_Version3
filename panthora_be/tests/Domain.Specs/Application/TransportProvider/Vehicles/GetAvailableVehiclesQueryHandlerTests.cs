using Application.Common.Constant;
using Application.Features.TransportProvider.Vehicles.DTOs;
using Application.Features.TransportProvider.Vehicles.Queries;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.TransportProvider.Vehicles;

public sealed class GetAvailableVehiclesQueryHandlerTests
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly ITourInstanceRepository _tourInstanceRepository;
    private readonly ILogger<GetAvailableVehiclesQueryHandler> _logger;
    private readonly GetAvailableVehiclesQueryHandler _handler;

    public GetAvailableVehiclesQueryHandlerTests()
    {
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _vehicleRepository = Substitute.For<IVehicleRepository>();
        _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        _logger = Substitute.For<ILogger<GetAvailableVehiclesQueryHandler>>();

        _handler = new GetAvailableVehiclesQueryHandler(
            _supplierRepository,
            _vehicleRepository,
            _tourInstanceRepository,
            _logger);
    }

    [Fact]
    public async Task Handle_HappyPath_ReturnsAvailableVehicles()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var date = new DateOnly(2026, 5, 1);

        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity>
            {
                new() { Id = supplierId, IsActive = true, IsDeleted = false }
            });

        var mockResults = new List<VehicleAvailabilityResult>
        {
            new(new VehicleEntity
            {
                Id = Guid.NewGuid(),
                VehicleType = VehicleType.Car,
                Brand = "Toyota",
                Model = "Camry",
                SeatCapacity = 4,
                Quantity = 3,
                Notes = null
            }, 2)
        };

        _vehicleRepository.GetAvailableBySupplierAsync(
            Arg.Is<IReadOnlyCollection<Guid>>(ids => ids.Contains(supplierId)),
            userId,
            null,
            date,
            null,
            Arg.Any<CancellationToken>()).Returns(mockResults);

        var query = new GetAvailableVehiclesQuery(userId, date, null, null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(result.Value);
        Assert.Equal("Toyota", result.Value[0].Brand);
        Assert.Equal(2, result.Value[0].AvailableQuantity);
    }

    [Fact]
    public async Task Handle_NoSupplier_ReturnsValidationError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var date = new DateOnly(2026, 5, 1);

        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity>());

        var query = new GetAvailableVehiclesQuery(userId, date, null, null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Validation, result.FirstError.Type);
        Assert.Equal(ErrorConstants.VehicleAvailability.NoSupplierCode, result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_ExcludeActivityIdBelongsToAnotherSupplier_ReturnsForbidden()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var mySupplierId = Guid.NewGuid();
        var otherSupplierId = Guid.NewGuid();
        var excludeActivityId = Guid.NewGuid();
        var date = new DateOnly(2026, 5, 1);

        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity>
            {
                new() { Id = mySupplierId, IsActive = true, IsDeleted = false }
            });

        _tourInstanceRepository.FindActivityByIdAsync(excludeActivityId, Arg.Any<CancellationToken>())
            .Returns(new TourInstanceDayActivityEntity
            {
                Id = excludeActivityId,
                TransportSupplierId = otherSupplierId // Activity owned by someone else!
            });

        var query = new GetAvailableVehiclesQuery(userId, date, null, excludeActivityId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Forbidden, result.FirstError.Type);
        Assert.Equal(ErrorConstants.VehicleAvailability.ActivityNotOwnedCode, result.FirstError.Code);
    }
}
