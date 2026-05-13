using Application.Common.Interfaces;
using Application.Common.Constant;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Constant;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Commands.RejectWithdrawal;

public sealed class RejectWithdrawalCommandHandler(
    ICurrentUser currentUser,
    IWithdrawalRequestRepository withdrawalRequestRepository,
    IUserRepository userRepository,
    ITransactionHistoryRepository transactionHistoryRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<RejectWithdrawalCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(RejectWithdrawalCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } adminId || !currentUser.IsInRole(RoleConstants.Admin))
        {
            return Error.Forbidden("Withdrawal.Forbidden", "Only admins can reject withdrawals.");
        }

        var withdrawal = await withdrawalRequestRepository.GetByIdAsync(request.Id, cancellationToken);
        if (withdrawal is null)
        {
            return Error.NotFound("Withdrawal.NotFound", "Withdrawal request not found.");
        }

        if (withdrawal.Status != WithdrawalStatus.Pending)
        {
            return Error.Validation("Withdrawal.NotPending", "Only pending requests can be rejected.");
        }

        var user = await userRepository.FindById(withdrawal.UserId, cancellationToken);
        if (user is null)
        {
            return Error.NotFound("Withdrawal.UserNotFound", "User not found.");
        }

        withdrawal.Reject(request.Reason);
        withdrawalRequestRepository.Update(withdrawal);

        user.CreditBalance(withdrawal.Amount);

        var adminUser = await userRepository.FindById(adminId, cancellationToken);
        var performedBy = adminUser?.FullName ?? adminUser?.Username ?? "Admin";

        var transactionHistory = TransactionHistoryEntity.CreateCredit(
            user.Id,
            withdrawal.Amount,
            $"Yêu cầu rút tiền bị từ chối: {withdrawal.RejectionReason}",
            performedBy);

        await transactionHistoryRepository.AddAsync(transactionHistory, cancellationToken);

        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}
