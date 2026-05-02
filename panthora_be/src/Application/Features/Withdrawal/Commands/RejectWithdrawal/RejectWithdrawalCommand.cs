using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Commands.RejectWithdrawal;

public sealed record RejectWithdrawalCommand(Guid Id, string Reason) : IRequest<ErrorOr<Success>>;
