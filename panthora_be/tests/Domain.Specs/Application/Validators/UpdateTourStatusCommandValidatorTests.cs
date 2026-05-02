using global::Application.Features.Tour.Commands;
using global::Domain.Enums;

namespace Domain.Specs.Application.Validators;

/// <summary>
/// Test cases for UpdateTourStatusCommandValidator covering valid enum values,
/// invalid enum values, and boundary conditions.
/// </summary>
public sealed class UpdateTourStatusCommandValidatorTests
{
    private readonly UpdateTourStatusCommandValidator _validator = new();

    #region Valid enum values (TourStatus: Active=1, Inactive=2, Pending=3, Rejected=4)

    [Theory]
    [InlineData(TourStatus.Active)]
    [InlineData(TourStatus.Inactive)]
    [InlineData(TourStatus.Pending)]
    [InlineData(TourStatus.Rejected)]
    public void Validate_ValidEnumValue_ShouldPass(TourStatus status)
    {
        var command = new UpdateTourStatusCommand(Guid.NewGuid(), status);
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region Invalid enum values (out of range)

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    [InlineData(999)]
    public void Validate_InvalidEnumValue_ShouldFail(int statusValue)
    {
        // Cast the invalid integer to TourStatus — this simulates receiving an out-of-range value
        var status = (TourStatus)statusValue;
        var command = new UpdateTourStatusCommand(Guid.NewGuid(), status);
        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateTourStatusCommand.Status));
    }

    #endregion

    #region Boundary values

    [Theory]
    [InlineData(1)]   // Active — lowest defined value
    [InlineData(4)]   // Rejected — highest defined value
    public void Validate_BoundaryEnumValues_ShouldPass(int statusValue)
    {
        var status = (TourStatus)statusValue;
        var command = new UpdateTourStatusCommand(Guid.NewGuid(), status);
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region Empty GUID

    [Fact]
    public void Validate_EmptyGuid_ShouldFail()
    {
        var command = new UpdateTourStatusCommand(Guid.Empty, TourStatus.Active);
        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateTourStatusCommand.Id));
    }

    #endregion
}
