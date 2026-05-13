using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Commands.ApproveWithdrawal;

public sealed record ApproveWithdrawalCommand(Guid Id) : IRequest<ErrorOr<Success>>;
