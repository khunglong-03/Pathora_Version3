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

public sealed class GetVehicleScheduleQueryHandlerTests
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly IVehicleBlockRepository _vehicleBlockRepository;
    private readonly ILogger<GetVehicleScheduleQueryHandler> _logger;
    private readonly GetVehicleScheduleQueryHandler _handler;

    public GetVehicleScheduleQueryHandlerTests()
    {
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _vehicleBlockRepository = Substitute.For<IVehicleBlockRepository>();
        _logger = Substitute.For<ILogger<GetVehicleScheduleQueryHandler>>();

        _handler = new GetVehicleScheduleQueryHandler(
            _supplierRepository,
            _vehicleBlockRepository,
            _logger);
    }

    [Fact]
    public async Task Handle_HappyPath_ReturnsSchedule()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var from = new DateOnly(2026, 5, 1);
        var to = new DateOnly(2026, 5, 31);

        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity>
            {
                new() { Id = supplierId, IsActive = true, IsDeleted = false }
            });

        var projections = new List<VehicleScheduleProjection>
        {
            new(
                Guid.NewGuid(),
                Guid.NewGuid(),
                VehicleType.Car,
                "Toyota",
                "Camry",
                4,
                new DateOnly(2026, 5, 15),
                HoldStatus.Hard,
                "Tour 1",
                "T1",
                "Act 1",
                "Loc A",
                "Loc B")
        };

        _vehicleBlockRepository.GetByOwnerAndDateRangeAsync(
            Arg.Is<IReadOnlyCollection<Guid>>(ids => ids.Contains(supplierId)),
            userId,
            from,
            to,
            null,
            Arg.Any<CancellationToken>()).Returns(projections);

        var query = new GetVehicleScheduleQuery(userId, from, to, null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(result.Value);
        Assert.Equal("Toyota", result.Value[0].VehicleBrand);
    }

    [Fact]
    public async Task Handle_NoSupplier_ReturnsValidationError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var from = new DateOnly(2026, 5, 1);
        var to = new DateOnly(2026, 5, 31);

        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity>());

        var query = new GetVehicleScheduleQuery(userId, from, to, null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Validation, result.FirstError.Type);
        Assert.Equal(ErrorConstants.VehicleAvailability.NoSupplierCode, result.FirstError.Code);
    }
}
