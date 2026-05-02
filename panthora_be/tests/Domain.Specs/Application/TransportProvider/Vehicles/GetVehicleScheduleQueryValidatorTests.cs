using Application.Features.TransportProvider.Vehicles.Queries;
using Xunit;

namespace Domain.Specs.Application.TransportProvider.Vehicles;

public sealed class GetVehicleScheduleQueryValidatorTests
{
    private readonly GetVehicleScheduleQueryValidator _validator = new();

    [Fact]
    public void Validate_ValidRange_ReturnsTrue()
    {
        var query = new GetVehicleScheduleQuery(
            Guid.NewGuid(),
            new DateOnly(2026, 5, 1),
            new DateOnly(2026, 5, 31),
            null);

        var result = _validator.Validate(query);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_FromAfterTo_ReturnsFalse()
    {
        var query = new GetVehicleScheduleQuery(
            Guid.NewGuid(),
            new DateOnly(2026, 6, 1),
            new DateOnly(2026, 5, 31),
            null);

        var result = _validator.Validate(query);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("End date must be on or after start date"));
    }

    [Fact]
    public void Validate_RangeExceedsOneYear_ReturnsFalse()
    {
        var query = new GetVehicleScheduleQuery(
            Guid.NewGuid(),
            new DateOnly(2026, 1, 1),
            new DateOnly(2027, 2, 1), // 13 months
            null);

        var result = _validator.Validate(query);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("Date range cannot exceed one year"));
    }
}
