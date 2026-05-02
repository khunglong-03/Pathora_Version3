using global::Application.Features.TransportProvider.Drivers.DTOs;
using global::Application.Features.TransportProvider.Drivers.Validators;
using global::Domain.Common.Repositories;
using global::Domain.Enums;
using FluentValidation.TestHelper;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Validators;

public sealed class CreateDriverRequestDtoValidatorTests
{
    private readonly IDriverRepository _driverRepository;
    private readonly CreateDriverRequestDtoValidator _validator;

    public CreateDriverRequestDtoValidatorTests()
    {
        _driverRepository = Substitute.For<IDriverRepository>();
        _driverRepository.ExistsByLicenseNumberAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(false);
        _validator = new CreateDriverRequestDtoValidator(_driverRepository);
    }

    private static CreateDriverRequestDto ValidDto() => new(
        FullName: "Nguyen Van A",
        LicenseNumber: "0123456789",
        LicenseType: (int)DriverLicenseType.B2,
        PhoneNumber: "0912345678",
        AvatarUrl: null,
        Notes: null);

    #region FullName

    [Fact]
    public async Task Validate_ValidDto_Passes()
    {
        var dto = ValidDto();
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public async Task Validate_EmptyFullName_Fails()
    {
        var dto = ValidDto() with { FullName = "" };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldHaveValidationErrorFor(x => x.FullName)
            .WithErrorMessage("Full name is required.");
    }

    [Fact]
    public async Task Validate_WhitespaceFullName_Fails()
    {
        var dto = ValidDto() with { FullName = "   " };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldHaveValidationErrorFor(x => x.FullName);
    }

    [Fact]
    public async Task Validate_FullNameTooLong_Fails()
    {
        var dto = ValidDto() with { FullName = new string('A', 101) };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldHaveValidationErrorFor(x => x.FullName)
            .WithErrorMessage("Full name must not exceed 100 characters.");
    }

    [Fact]
    public async Task Validate_FullNameMaxChars_Passes()
    {
        var dto = ValidDto() with { FullName = new string('A', 100) };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.FullName);
    }

    #endregion

    #region LicenseNumber

    [Fact]
    public async Task Validate_EmptyLicenseNumber_Fails()
    {
        var dto = ValidDto() with { LicenseNumber = "" };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldHaveValidationErrorFor(x => x.LicenseNumber)
            .WithErrorMessage("License number is required.");
    }

    [Fact]
    public async Task Validate_LicenseNumberTooLong_Fails()
    {
        var dto = ValidDto() with { LicenseNumber = new string('1', 51) };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldHaveValidationErrorFor(x => x.LicenseNumber)
            .WithErrorMessage("License number must not exceed 50 characters.");
    }

    [Fact]
    public async Task Validate_LicenseNumberAlreadyExists_Fails()
    {
        _driverRepository.ExistsByLicenseNumberAsync("0123456789", Arg.Any<CancellationToken>())
            .Returns(true);

        var dto = ValidDto() with { LicenseNumber = "0123456789" };
        var result = await _validator.TestValidateAsync(dto);

        result.ShouldHaveValidationErrorFor(x => x.LicenseNumber)
            .WithErrorMessage("This license number is already registered.");
    }

    [Fact]
    public async Task Validate_NewLicenseNumber_Passes()
    {
        var dto = ValidDto() with { LicenseNumber = "9999999999" };
        var result = await _validator.TestValidateAsync(dto);
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
    public async Task Validate_ValidLicenseType_Passes(DriverLicenseType type)
    {
        var dto = ValidDto() with { LicenseType = (int)type };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.LicenseType);
    }

    [Fact]
    public async Task Validate_InvalidLicenseType_Fails()
    {
        var dto = ValidDto() with { LicenseType = 99 };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldHaveValidationErrorFor(x => x.LicenseType)
            .WithErrorMessage("Invalid license type.");
    }

    #endregion

    #region PhoneNumber

    [Theory]
    [InlineData("0912345678")]
    [InlineData("0123456789")]
    [InlineData("0987654321")]
    [InlineData("+84912345678")]
    [InlineData("+840123456789")]
    public async Task Validate_ValidVietnamesePhone_Passes(string phone)
    {
        var dto = ValidDto() with { PhoneNumber = phone };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.PhoneNumber);
    }

    [Theory]
    [InlineData("")]
    [InlineData("123456")]
    [InlineData("123456789012")]
    [InlineData("abcdefghij")]
    [InlineData("+84912")]       // too short
    [InlineData("091234567")]   // 9 digits without +84
    [InlineData("84123456789")]  // missing +
    public async Task Validate_InvalidPhone_Fails(string phone)
    {
        var dto = ValidDto() with { PhoneNumber = phone };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldHaveValidationErrorFor(x => x.PhoneNumber)
            .WithErrorMessage("Phone number must be a valid Vietnamese format (e.g., 0912345678 or +84912345678).");
    }

    #endregion

    #region AvatarUrl

    [Fact]
    public async Task Validate_NullAvatarUrl_Passes()
    {
        var dto = ValidDto() with { AvatarUrl = null };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public async Task Validate_WithAvatarUrl_Passes()
    {
        var dto = ValidDto() with { AvatarUrl = "https://cdn.example.com/avatar.jpg" };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    #endregion
}
