using FluentValidation;

namespace Application.Features.Withdrawal.Commands.CreateWithdrawalRequest;

public sealed class CreateWithdrawalRequestCommandValidator : AbstractValidator<CreateWithdrawalRequestCommand>
{
    public CreateWithdrawalRequestCommandValidator()
    {
        RuleFor(x => x.BankAccountId)
            .NotEmpty()
            .WithMessage("BankAccountId is required.");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("Amount must be greater than 0.")
            .InclusiveBetween(100_000m, 10_000_000m)
            .WithMessage("Amount must be between 100,000 and 10,000,000 VND.");
    }
}
