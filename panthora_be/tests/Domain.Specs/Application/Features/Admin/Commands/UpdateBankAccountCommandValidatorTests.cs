namespace Domain.Specs.Application.Features.Admin.Commands;

using global::Application.Contracts.Admin;
using global::Application.Features.Admin.Commands.UpdateBankAccount;
using global::FluentValidation.TestHelper;
using global::Xunit;

public sealed class UpdateBankAccountCommandValidatorTests
{
    private readonly global::Application.Features.Admin.Commands.UpdateBankAccount.UpdateBankAccountCommandValidator _validator = new();

    #region BankAccountNumber validation

    [Fact]
    public void Validate_ValidBankAccountNumber_Passes()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("1234567890", "MB", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.Request.BankAccountNumber);
    }

    [Fact]
    public void Validate_EmptyBankAccountNumber_Fails()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("", "MB", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.BankAccountNumber)
            .WithErrorMessage("Bank account number is required.");
    }

    [Fact]
    public void Validate_NonDigitsBankAccountNumber_Fails()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("1234ABCD", "MB", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.BankAccountNumber)
            .WithErrorMessage("Bank account number must contain only digits.");
    }

    [Fact]
    public void Validate_TooShortBankAccountNumber_Fails()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("12345", "MB", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.BankAccountNumber)
            .WithErrorMessage("Bank account number must be 6-20 digits.");
    }

    [Fact]
    public void Validate_TooLongBankAccountNumber_Fails()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("123456789012345678901", "MB", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.BankAccountNumber)
            .WithErrorMessage("Bank account number must be 6-20 digits.");
    }

    [Fact]
    public void Validate_MinLengthBankAccountNumber_Passes()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("123456", "MB", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.Request.BankAccountNumber);
    }

    #endregion

    #region BankCode validation

    [Fact]
    public void Validate_ValidBankCode_Passes()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("1234567890", "MB", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.Request.BankCode);
    }

    [Fact]
    public void Validate_EmptyBankCode_Fails()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("1234567890", "", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.BankCode)
            .WithErrorMessage("Bank code is required.");
    }

    [Fact]
    public void Validate_LowercaseBankCode_Fails()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("1234567890", "mb", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.BankCode)
            .WithErrorMessage("Bank code must be uppercase letters.");
    }

    [Fact]
    public void Validate_BankCodeWithDigits_Fails()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("1234567890", "M1", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.BankCode)
            .WithErrorMessage("Bank code must be uppercase letters.");
    }

    [Fact]
    public void Validate_SingleCharBankCode_Fails()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("1234567890", "M", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.BankCode)
            .WithErrorMessage("Bank code must be 2-10 characters.");
    }

    [Fact]
    public void Validate_MaxLengthBankCode_Passes()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("1234567890", "MEGABANK", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.Request.BankCode);
    }

    #endregion

    #region BankAccountName validation

    [Fact]
    public void Validate_NullBankAccountName_Passes()
    {
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("1234567890", "MB", null));

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.Request.BankAccountName);
    }

    [Fact]
    public void Validate_TooLongBankAccountName_Fails()
    {
        var longName = new string('A', 201);
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("1234567890", "MB", longName));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Request.BankAccountName)
            .WithErrorMessage("Account name must not exceed 200 characters.");
    }

    [Fact]
    public void Validate_MaxLengthBankAccountName_Passes()
    {
        var maxName = new string('A', 200);
        var command = new UpdateBankAccountCommand(
            Guid.NewGuid(),
            new UpdateBankAccountRequest("1234567890", "MB", maxName));

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.Request.BankAccountName);
    }

    #endregion

    #region ManagerId validation

    [Fact]
    public void Validate_EmptyManagerId_Fails()
    {
        var command = new UpdateBankAccountCommand(
            Guid.Empty,
            new UpdateBankAccountRequest("1234567890", "MB", "Nguyen Van A"));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.ManagerId);
    }

    #endregion
}
