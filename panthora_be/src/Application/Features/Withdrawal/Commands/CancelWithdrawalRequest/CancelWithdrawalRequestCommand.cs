using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Commands.CancelWithdrawalRequest;

public sealed record CancelWithdrawalRequestCommand(Guid Id) : IRequest<ErrorOr<Success>>;
