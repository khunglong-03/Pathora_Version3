using Application.Common.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Commands.CancelWithdrawalRequest;

public sealed class CancelWithdrawalRequestCommandHandler(
    ICurrentUser currentUser,
    IWithdrawalRequestRepository withdrawalRequestRepository,
    IUserRepository userRepository,
    ITransactionHistoryRepository transactionHistoryRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<CancelWithdrawalRequestCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(CancelWithdrawalRequestCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Error.Unauthorized();
        }

        var withdrawal = await withdrawalRequestRepository.GetByIdAsync(request.Id, cancellationToken);
        if (withdrawal is null)
        {
            return Error.NotFound("Withdrawal.NotFound", "Withdrawal request not found.");
        }

        if (withdrawal.UserId != userId)
        {
            return Error.Forbidden("Withdrawal.Forbidden", "Not allowed to cancel this withdrawal request.");
        }

        if (withdrawal.Status != WithdrawalStatus.Pending)
        {
            return Error.Validation("Withdrawal.NotPending", "Only pending requests can be cancelled.");
        }

        var user = await userRepository.FindById(userId, cancellationToken);
        if (user is null)
        {
            return Error.NotFound("Withdrawal.UserNotFound", "User not found.");
        }

        withdrawal.Cancel();
        withdrawalRequestRepository.Update(withdrawal);

        user.CreditBalance(withdrawal.Amount);

        var performedBy = user.FullName ?? user.Username;

        var transactionHistory = TransactionHistoryEntity.CreateCredit(
            userId,
            withdrawal.Amount,
            $"Huỷ yêu cầu rút tiền #{withdrawal.Id.ToString()[..8]}",
            performedBy);

        await transactionHistoryRepository.AddAsync(transactionHistory, cancellationToken);

        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}
