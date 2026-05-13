using FluentValidation;

namespace Application.Features.Withdrawal.Commands.RejectWithdrawal;

public sealed class RejectWithdrawalCommandValidator : AbstractValidator<RejectWithdrawalCommand>
{
    public RejectWithdrawalCommandValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("Rejection reason is required.")
            .MinimumLength(5)
            .WithMessage("Rejection reason must be at least 5 characters.");
    }
}
