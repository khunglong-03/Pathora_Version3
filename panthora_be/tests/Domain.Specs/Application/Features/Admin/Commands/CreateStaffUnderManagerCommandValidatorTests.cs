using global::Application.Contracts.Admin;
using global::Application.Features.Admin.Commands.CreateStaffUnderManager;
using global::Application.Features.Admin.Validators;
using FluentValidation.TestHelper;
using Xunit;

namespace Domain.Specs.Application.Features.Admin.Commands;

public sealed class CreateStaffUnderManagerCommandValidatorTests
{
    private readonly CreateStaffUnderManagerCommandValidator _validator = new();

    [Fact]
    public void Validate_ValidTourDesignerStaffType_Passes()
    {
        var command = new CreateStaffUnderManagerCommand(
            Guid.NewGuid(),
            new CreateStaffUnderManagerRequest(null, "test@example.com", "Test User", 1));

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_ValidTourGuideStaffType_Passes()
    {
        var command = new CreateStaffUnderManagerCommand(
            Guid.NewGuid(),
            new CreateStaffUnderManagerRequest(null, "guide@example.com", "Guide User", 2));

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_EmptyManagerId_Fails()
    {
        var command = new CreateStaffUnderManagerCommand(
            Guid.Empty,
            new CreateStaffUnderManagerRequest(null, "test@example.com", "Test User", 1));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.ManagerId);
    }

    [Fact]
    public void Validate_EmptyEmail_Fails()
    {
        var command = new CreateStaffUnderManagerCommand(
            Guid.NewGuid(),
            new CreateStaffUnderManagerRequest(null, "", "Test User", 1));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.Email);
    }

    [Fact]
    public void Validate_InvalidEmail_Fails()
    {
        var command = new CreateStaffUnderManagerCommand(
            Guid.NewGuid(),
            new CreateStaffUnderManagerRequest(null, "not-an-email", "Test User", 1));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.Email);
    }

    [Fact]
    public void Validate_EmptyFullName_Fails()
    {
        var command = new CreateStaffUnderManagerCommand(
            Guid.NewGuid(),
            new CreateStaffUnderManagerRequest(null, "test@example.com", "", 1));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.FullName);
    }

    [Fact]
    public void Validate_ZeroStaffType_Fails()
    {
        var command = new CreateStaffUnderManagerCommand(
            Guid.NewGuid(),
            new CreateStaffUnderManagerRequest(null, "test@example.com", "Test User", 0));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.StaffType);
    }

    [Fact]
    public void Validate_StaffTypeThree_Fails()
    {
        var command = new CreateStaffUnderManagerCommand(
            Guid.NewGuid(),
            new CreateStaffUnderManagerRequest(null, "test@example.com", "Test User", 3));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.StaffType);
    }

    [Fact]
    public void Validate_NegativeStaffType_Fails()
    {
        var command = new CreateStaffUnderManagerCommand(
            Guid.NewGuid(),
            new CreateStaffUnderManagerRequest(null, "test@example.com", "Test User", -1));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.StaffType);
    }

    [Fact]
    public void Validate_MultipleErrors_ReturnsAllErrors()
    {
        var command = new CreateStaffUnderManagerCommand(
            Guid.Empty,
            new CreateStaffUnderManagerRequest(null, "", "", 0));

        var result = _validator.TestValidate(command);

        Assert.True(result.Errors.Count >= 3);
    }
}
