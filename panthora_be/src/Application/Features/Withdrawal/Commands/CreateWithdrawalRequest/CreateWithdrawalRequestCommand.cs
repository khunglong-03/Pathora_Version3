using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Commands.CreateWithdrawalRequest;

public sealed record CreateWithdrawalRequestCommand(
    Guid BankAccountId,
    decimal Amount) : IRequest<ErrorOr<Guid>>;
