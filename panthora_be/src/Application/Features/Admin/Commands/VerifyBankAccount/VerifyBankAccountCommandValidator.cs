namespace Application.Features.Admin.Commands.VerifyBankAccount;

using FluentValidation;

public sealed class VerifyBankAccountCommandValidator : AbstractValidator<VerifyBankAccountCommand>
{
    public VerifyBankAccountCommandValidator()
    {
        RuleFor(x => x.ManagerId).NotEmpty();
    }
}
