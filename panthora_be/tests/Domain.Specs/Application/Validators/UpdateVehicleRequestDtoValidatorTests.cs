using global::Application.Features.TransportProvider.Vehicles.DTOs;
using global::Application.Features.TransportProvider.Vehicles.Validators;
using global::Domain.Enums;
using FluentValidation.TestHelper;
using Xunit;

namespace Domain.Specs.Application.Validators;

public sealed class UpdateVehicleRequestDtoValidatorTests
{
    private readonly UpdateVehicleRequestDtoValidator _validator = new();

    private static UpdateVehicleRequestDto ValidDto() => new(
        VehicleType: (int)VehicleType.Car,
        Brand: "Toyota",
        Model: "Camry",
        SeatCapacity: 5,
        Quantity: 1,
        LocationArea: (int?)Continent.Asia,
        OperatingCountries: "VN,TH",
        VehicleImageUrls: null,
        Notes: null);

    #region VehicleType

    [Theory]
    [InlineData(VehicleType.Car)]
    [InlineData(VehicleType.Bus)]
    [InlineData(VehicleType.Minibus)]
    [InlineData(VehicleType.Van)]
    [InlineData(VehicleType.Coach)]
    [InlineData(VehicleType.Motorbike)]
    public void Validate_ValidGroundVehicleType_Passes(VehicleType type)
    {
        var dto = ValidDto() with { VehicleType = (int)type };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.VehicleType);
    }

    [Fact]
    public void Validate_InvalidVehicleType_Fails()
    {
        var dto = ValidDto() with { VehicleType = 99 };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.VehicleType);
    }

    #endregion

    #region SeatCapacity

    [Theory]
    [InlineData(1)]
    [InlineData(50)]
    [InlineData(100)]
    public void Validate_ValidSeatCapacity_Passes(int capacity)
    {
        var dto = ValidDto() with { SeatCapacity = capacity };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.SeatCapacity);
    }

    [Fact]
    public void Validate_ZeroSeatCapacity_Fails()
    {
        var dto = ValidDto() with { SeatCapacity = 0 };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.SeatCapacity)
            .WithErrorMessage("Seat capacity must be greater than 0.");
    }

    [Fact]
    public void Validate_NegativeSeatCapacity_Fails()
    {
        var dto = ValidDto() with { SeatCapacity = -5 };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.SeatCapacity);
    }

    [Fact]
    public void Validate_SeatCapacityOver100_Fails()
    {
        var dto = ValidDto() with { SeatCapacity = 101 };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.SeatCapacity)
            .WithErrorMessage("Seat capacity must not exceed 100.");
    }

    [Fact]
    public void Validate_NullSeatCapacity_Passes()
    {
        var dto = ValidDto() with { SeatCapacity = null };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.SeatCapacity);
    }

    #endregion

    #region OperatingCountries

    [Theory]
    [InlineData("VN")]
    [InlineData("VN,TH,MY")]
    public void Validate_ValidOperatingCountries_Passes(string codes)
    {
        var dto = ValidDto() with { OperatingCountries = codes };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.OperatingCountries);
    }

    [Fact]
    public void Validate_LowercaseCodes_Fails()
    {
        var dto = ValidDto() with { OperatingCountries = "vn" };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.OperatingCountries)
            .WithErrorMessage("Operating countries must be comma-separated 2-letter uppercase ISO codes (e.g. VN,TH,MY).");
    }

    [Fact]
    public void Validate_TooLong_Fails()
    {
        var dto = ValidDto() with { OperatingCountries = new string('A', 501) };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.OperatingCountries);
    }

    [Fact]
    public void Validate_EmptyOperatingCountries_Passes()
    {
        var dto = ValidDto() with { OperatingCountries = null };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.OperatingCountries);
    }

    #endregion

    #region LocationArea

    [Fact]
    public void Validate_ValidLocationArea_Passes()
    {
        var dto = ValidDto() with { LocationArea = (int?)Continent.Europe };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.LocationArea);
    }

    [Fact]
    public void Validate_InvalidLocationArea_Fails()
    {
        var dto = ValidDto() with { LocationArea = 99 };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.LocationArea)
            .WithErrorMessage("Invalid location area.");
    }

    [Fact]
    public void Validate_NullLocationArea_Passes()
    {
        var dto = ValidDto() with { LocationArea = null };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.LocationArea);
    }

    #endregion

    #region AllFieldsNull_Passes

    [Fact]
    public void Validate_AllOptionalFieldsNull_Passes()
    {
        var dto = new UpdateVehicleRequestDto(
            VehicleType: (int)VehicleType.Car,
            Brand: null,
            Model: null,
            SeatCapacity: null,
            Quantity: null,
            LocationArea: null,
            OperatingCountries: null,
            VehicleImageUrls: null,
            Notes: null);
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    #endregion
}
