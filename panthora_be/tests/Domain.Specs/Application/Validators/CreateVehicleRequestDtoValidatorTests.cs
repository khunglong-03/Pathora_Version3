using Application.Features.TransportProvider.Vehicles.DTOs;
using Application.Features.TransportProvider.Vehicles.Validators;
using Domain.Common.Repositories;
using Domain.Enums;
using FluentValidation.TestHelper;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Validators;

public sealed class CreateVehicleRequestDtoValidatorTests
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly CreateVehicleRequestDtoValidator _validator;

    public CreateVehicleRequestDtoValidatorTests()
    {
        _vehicleRepository = Substitute.For<IVehicleRepository>();
        _vehicleRepository.ExistsByPlateAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(false);
        _validator = new CreateVehicleRequestDtoValidator(_vehicleRepository);
    }

    private static CreateVehicleRequestDto ValidDto(string plate = "30A-12345") => new(
        VehiclePlate: plate,
        VehicleType: (int)VehicleType.Car,
        Brand: "Toyota",
        Model: "Camry",
        SeatCapacity: 5,
        LocationArea: (int?)Continent.Asia,
        OperatingCountries: "VN,TH,MY",
        VehicleImageUrls: null,
        Notes: null);

    #region VehiclePlate

    [Fact]
    public void Validate_ValidDto_Passes()
    {
        var dto = ValidDto();
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_EmptyPlate_Fails()
    {
        var dto = ValidDto(). with { VehiclePlate = "" };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.VehiclePlate);
    }

    [Fact]
    public void Validate_PlateTooLong_Fails()
    {
        var dto = ValidDto(). with { VehiclePlate = new string('A', 21) };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.VehiclePlate)
            .WithErrorMessage("Vehicle plate must not exceed 20 characters.");
    }

    [Fact]
    public void Validate_PlateMaxChars_Passes()
    {
        var dto = ValidDto(). with { VehiclePlate = new string('A', 20) };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.VehiclePlate);
    }

    [Fact]
    public async Task Validate_PlateAlreadyExists_Fails()
    {
        _vehicleRepository.ExistsByPlateAsync("30A-12345", Arg.Any<CancellationToken>())
            .Returns(true);

        var dto = ValidDto("30A-12345");
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.VehiclePlate)
            .WithErrorMessage("Vehicle plate already exists.");
    }

    [Fact]
    public async Task Validate_NewPlate_Passes()
    {
        _vehicleRepository.ExistsByPlateAsync("99Z-99999", Arg.Any<CancellationToken>())
            .Returns(false);

        var dto = ValidDto("99Z-99999");
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.VehiclePlate);
    }

    #endregion

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
        var dto = ValidDto(). with { VehicleType = (int)type };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.VehicleType);
    }

    [Fact]
    public void Validate_TruckVehicleType_Fails()
    {
        // VehicleType 99 does not exist — IsInEnum fails
        var dto = ValidDto(). with { VehicleType = 99 };
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
        var dto = ValidDto(). with { SeatCapacity = capacity };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.SeatCapacity);
    }

    [Fact]
    public void Validate_ZeroSeatCapacity_Fails()
    {
        var dto = ValidDto(). with { SeatCapacity = 0 };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.SeatCapacity)
            .WithErrorMessage("Seat capacity must be greater than 0.");
    }

    [Fact]
    public void Validate_NegativeSeatCapacity_Fails()
    {
        var dto = ValidDto(). with { SeatCapacity = -5 };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.SeatCapacity);
    }

    [Fact]
    public void Validate_SeatCapacityOver100_Fails()
    {
        var dto = ValidDto(). with { SeatCapacity = 101 };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.SeatCapacity)
            .WithErrorMessage("Seat capacity must not exceed 100.");
    }

    #endregion

    #region OperatingCountries

    [Theory]
    [InlineData("VN")]
    [InlineData("VN,TH")]
    [InlineData("VN,TH,MY,SG")]
    public void Validate_ValidOperatingCountries_Passes(string codes)
    {
        var dto = ValidDto(). with { OperatingCountries = codes };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.OperatingCountries);
    }

    [Fact]
    public void Validate_EmptyOperatingCountries_Passes()
    {
        var dto = ValidDto(). with { OperatingCountries = null };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.OperatingCountries);
    }

    [Fact]
    public void Validate_LowercaseCodes_Fails()
    {
        var dto = ValidDto(). with { OperatingCountries = "vn,th" };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.OperatingCountries)
            .WithErrorMessage("Operating countries must be comma-separated 2-letter uppercase ISO codes (e.g. VN,TH,MY).");
    }

    [Fact]
    public void Validate_ThreeLetterCode_Fails()
    {
        var dto = ValidDto(). with { OperatingCountries = "VNM,THA" };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.OperatingCountries);
    }

    [Fact]
    public void Validate_TooLong_Fails()
    {
        var dto = ValidDto(). with { OperatingCountries = new string('A', 501) };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.OperatingCountries)
            .WithErrorMessage("Operating countries must not exceed 500 characters.");
    }

    #endregion

    #region LocationArea

    [Theory]
    [InlineData(Continent.Asia)]
    [InlineData(Continent.Europe)]
    [InlineData(Continent.NorthAmerica)]
    public void Validate_ValidLocationArea_Passes(Continent area)
    {
        var dto = ValidDto(). with { LocationArea = (int?)area };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.LocationArea);
    }

    [Fact]
    public void Validate_InvalidLocationArea_Fails()
    {
        var dto = ValidDto(). with { LocationArea = 99 };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.LocationArea)
            .WithErrorMessage("Invalid location area.");
    }

    [Fact]
    public void Validate_NullLocationArea_Passes()
    {
        var dto = ValidDto(). with { LocationArea = null };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.LocationArea);
    }

    #endregion
}