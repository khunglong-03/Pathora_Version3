using BuildingBlocks.CORS;
using FluentValidation;

namespace Application.Features.Manager.Commands.UpdateManagerBankAccount;

public sealed class UpdateManagerBankAccountCommandValidator : AbstractValidator<UpdateManagerBankAccountCommand>
{
    public UpdateManagerBankAccountCommandValidator()
    {
        RuleFor(x => x.AccountId)
            .NotEmpty().WithMessage("Account ID is required.");

        RuleFor(x => x.Request.BankAccountNumber)
            .NotEmpty().WithMessage("Bank account number is required.")
            .Length(6, 20).WithMessage("Bank account number must be 6-20 digits.")
            .Matches(@"^\d+$").WithMessage("Bank account number must contain only digits.");

        RuleFor(x => x.Request.BankCode)
            .NotEmpty().WithMessage("Bank code is required.")
            .MaximumLength(20).WithMessage("Bank code must not exceed 20 characters.");

        RuleFor(x => x.Request.BankBin)
            .NotEmpty().WithMessage("Bank BIN is required.")
            .MaximumLength(10).WithMessage("Bank BIN must not exceed 10 characters.");

        RuleFor(x => x.Request.BankAccountName)
            .MaximumLength(200).WithMessage("Account name must not exceed 200 characters.");
    }
}
