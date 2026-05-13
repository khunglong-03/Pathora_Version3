using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Commands.ConfirmWithdrawalTransfer;

public sealed record ConfirmWithdrawalTransferCommand(Guid Id) : IRequest<ErrorOr<Success>>;
