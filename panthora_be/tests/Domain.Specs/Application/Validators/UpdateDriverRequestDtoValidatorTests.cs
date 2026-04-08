using Application.Features.TransportProvider.Drivers.DTOs;
using Application.Features.TransportProvider.Drivers.Validators;
using Domain.Enums;
using FluentValidation.TestHelper;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Validators;

public sealed class UpdateDriverRequestDtoValidatorTests
{
    private readonly IDriverRepository _driverRepository;
    private readonly UpdateDriverRequestDtoValidator _validator;

    public UpdateDriverRequestDtoValidatorTests()
    {
        _driverRepository = Substitute.For<IDriverRepository>();
        _validator = new UpdateDriverRequestDtoValidator(_driverRepository);
    }

    private static UpdateDriverRequestDto ValidDto() => new(
        FullName: "Nguyen Van A",
        LicenseNumber: "0123456789",
        LicenseType: (int?)DriverLicenseType.B2,
        PhoneNumber: "0912345678",
        AvatarUrl: null,
        Notes: null);

    #region FullName

    [Fact]
    public void Validate_AllFieldsNull_Passes()
    {
        var dto = new UpdateDriverRequestDto(
            FullName: null,
            LicenseNumber: null,
            LicenseType: null,
            PhoneNumber: null,
            AvatarUrl: null,
            Notes: null);
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_FullNameTooLong_Fails()
    {
        var dto = ValidDto() with { FullName = new string('A', 101) };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.FullName)
            .WithErrorMessage("Full name must not exceed 100 characters.");
    }

    [Fact]
    public void Validate_FullNameMaxChars_Passes()
    {
        var dto = ValidDto() with { FullName = new string('A', 100) };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.FullName);
    }

    #endregion

    #region LicenseNumber

    [Fact]
    public void Validate_LicenseNumberTooLong_Fails()
    {
        var dto = ValidDto() with { LicenseNumber = new string('1', 51) };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.LicenseNumber)
            .WithErrorMessage("License number must not exceed 50 characters.");
    }

    [Fact]
    public void Validate_LicenseNumberNull_Passes()
    {
        var dto = ValidDto() with { LicenseNumber = null };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.LicenseNumber);
    }

    #endregion

    #region LicenseType

    [Theory]
    [InlineData(DriverLicenseType.B1)]
    [InlineData(DriverLicenseType.B2)]
    [InlineData(DriverLicenseType.C)]
    [InlineData(DriverLicenseType.D)]
    [InlineData(DriverLicenseType.E)]
    [InlineData(DriverLicenseType.F)]
    public void Validate_ValidLicenseType_Passes(DriverLicenseType type)
    {
        var dto = ValidDto() with { LicenseType = (int?)type };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.LicenseType);
    }

    [Fact]
    public void Validate_InvalidLicenseType_Fails()
    {
        var dto = ValidDto() with { LicenseType = 99 };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.LicenseType)
            .WithErrorMessage("Invalid license type.");
    }

    [Fact]
    public void Validate_NullLicenseType_Passes()
    {
        var dto = ValidDto() with { LicenseType = null };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.LicenseType);
    }

    #endregion

    #region PhoneNumber

    [Theory]
    [InlineData("0912345678")]
    [InlineData("+84912345678")]
    [InlineData("+840123456789")]
    public void Validate_ValidVietnamesePhone_Passes(string phone)
    {
        var dto = ValidDto() with { PhoneNumber = phone };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.PhoneNumber);
    }

    [Theory]
    [InlineData("123456")]
    [InlineData("abcdefghij")]
    [InlineData("091234567")]   // 9 digits without +84
    [InlineData("+84912")]       // too short with +
    public void Validate_InvalidPhone_Fails(string phone)
    {
        var dto = ValidDto() with { PhoneNumber = phone };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.PhoneNumber)
            .WithErrorMessage("Phone number must be a valid Vietnamese format.");
    }

    [Fact]
    public void Validate_NullPhone_Passes()
    {
        var dto = ValidDto() with { PhoneNumber = null };
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.PhoneNumber);
    }

    #endregion
}
