namespace Application.Features.Admin.Commands.UpdateBankAccount;

using FluentValidation;

public sealed class UpdateBankAccountCommandValidator : AbstractValidator<UpdateBankAccountCommand>
{
    public UpdateBankAccountCommandValidator()
    {
        RuleFor(x => x.ManagerId).NotEmpty();
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
