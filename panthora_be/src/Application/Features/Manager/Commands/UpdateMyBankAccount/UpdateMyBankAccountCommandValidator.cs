using Application.Contracts.Manager;
using BuildingBlocks.CORS;
using FluentValidation;

namespace Application.Features.Manager.Commands.UpdateMyBankAccount;

public sealed class UpdateMyBankAccountCommandValidator : AbstractValidator<UpdateMyBankAccountCommand>
{
    public UpdateMyBankAccountCommandValidator()
    {
        RuleFor(x => x.Request.BankAccountNumber)
            .NotEmpty().WithMessage("Bank account number is required.")
            .Length(6, 20).WithMessage("Bank account number must be 6-20 digits.")
            .Matches(@"^\d+$").WithMessage("Bank account number must contain only digits.");

        RuleFor(x => x.Request.BankCode)
            .NotEmpty().WithMessage("Bank code is required.")
            .Length(2, 10).WithMessage("Bank code must be 2-10 characters.")
            .Matches(@"^[A-Z]+$").WithMessage("Bank code must be uppercase letters.");

        RuleFor(x => x.Request.BankAccountName)
            .MaximumLength(200).WithMessage("Account name must not exceed 200 characters.");
    }
}
