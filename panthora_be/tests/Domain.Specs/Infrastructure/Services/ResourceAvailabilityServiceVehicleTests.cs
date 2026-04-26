using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Infrastructure.Data;
using global::Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace Domain.Specs.Infrastructure.Services;

/// <summary>
/// §8.5–8.6: vehicle holds and availability (Hard block blocks other activities on same day).
/// </summary>
public sealed class ResourceAvailabilityServiceVehicleTests
{
    private readonly IVehicleBlockRepository _vehicleBlocks = Substitute.For<IVehicleBlockRepository>();
    private readonly ResourceAvailabilityService _sut;

    public ResourceAvailabilityServiceVehicleTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _sut = new ResourceAvailabilityService(
            Substitute.For<IRoomBlockRepository>(),
            _vehicleBlocks,
            Substitute.For<IHotelRoomInventoryRepository>(),
            new AppDbContext(options),
            NullLogger<ResourceAvailabilityService>.Instance);
    }

    [Fact]
    public async Task CheckVehicleAvailabilityAsync_8_5_AfterHardHoldForOtherActivity_ReturnsFalse()
    {
        var vehicleId = Guid.NewGuid();
        var date = new DateOnly(2026, 6, 1);
        var blockingActivityId = Guid.NewGuid();
        var otherActivityId = Guid.NewGuid();

        var hardBlock = VehicleBlockEntity.Create(
            vehicleId,
            date,
            "system",
            tourInstanceDayActivityId: blockingActivityId,
            holdStatus: HoldStatus.Hard);

        _vehicleBlocks.FindActiveBlocksAsync(vehicleId, date, Arg.Any<CancellationToken>())
            .Returns([hardBlock]);

        var result = await _sut.CheckVehicleAvailabilityAsync(vehicleId, date, otherActivityId, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.False(result.Value);
    }

    [Fact]
    public async Task CheckVehicleAvailabilityAsync_8_5_SameActivityExcluded_ReturnsTrue()
    {
        var vehicleId = Guid.NewGuid();
        var date = new DateOnly(2026, 6, 1);
        var activityId = Guid.NewGuid();

        var ownBlock = VehicleBlockEntity.Create(
            vehicleId,
            date,
            "system",
            tourInstanceDayActivityId: activityId,
            holdStatus: HoldStatus.Hard);

        _vehicleBlocks.FindActiveBlocksAsync(vehicleId, date, Arg.Any<CancellationToken>())
            .Returns([ownBlock]);

        // Re-approval / replace flow excludes this activity's own block
        var result = await _sut.CheckVehicleAvailabilityAsync(vehicleId, date, activityId, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.True(result.Value);
    }

    [Fact]
    public async Task CheckVehicleAvailabilityAsync_8_6_NoHolds_ReturnsTrue()
    {
        var vehicleId = Guid.NewGuid();
        var date = new DateOnly(2026, 6, 1);

        _vehicleBlocks.FindActiveBlocksAsync(vehicleId, date, Arg.Any<CancellationToken>())
            .Returns([]);

        var result = await _sut.CheckVehicleAvailabilityAsync(vehicleId, date, Guid.NewGuid(), CancellationToken.None);

        Assert.False(result.IsError);
        Assert.True(result.Value);
    }
}
