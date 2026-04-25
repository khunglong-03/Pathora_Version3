using global::Application.Features.Admin.Commands.ReassignStaff;
using global::Application.Features.Admin.Validators;
using FluentValidation.TestHelper;
using Xunit;

namespace Domain.Specs.Application.Features.Admin.Validators;

public sealed class ReassignStaffCommandValidatorTests
{
    private readonly ReassignStaffCommandValidator _validator = new();

    [Fact]
    public void Validate_ValidInput_Passes()
    {
        var command = new ReassignStaffCommand(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_EmptyManagerId_Fails()
    {
        var command = new ReassignStaffCommand(
            Guid.Empty, Guid.NewGuid(), Guid.NewGuid());

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.ManagerId);
    }

    [Fact]
    public void Validate_EmptyStaffId_Fails()
    {
        var command = new ReassignStaffCommand(
            Guid.NewGuid(), Guid.Empty, Guid.NewGuid());

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.StaffId);
    }

    [Fact]
    public void Validate_EmptyTargetManagerId_Fails()
    {
        var command = new ReassignStaffCommand(
            Guid.NewGuid(), Guid.NewGuid(), Guid.Empty);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.TargetManagerId);
    }

    [Fact]
    public void Validate_AllEmpty_ReturnsMultipleErrors()
    {
        var command = new ReassignStaffCommand(
            Guid.Empty, Guid.Empty, Guid.Empty);

        var result = _validator.TestValidate(command);

        Assert.True(result.Errors.Count >= 3);
        result.ShouldHaveValidationErrorFor(x => x.ManagerId);
        result.ShouldHaveValidationErrorFor(x => x.StaffId);
        result.ShouldHaveValidationErrorFor(x => x.TargetManagerId);
    }
}
