using Application.Common.Interfaces;
using Application.Common.Constant;
using Domain.Common.Repositories;
using Domain.Constant;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Commands.ApproveWithdrawal;

public sealed class ApproveWithdrawalCommandHandler(
    ICurrentUser currentUser,
    IWithdrawalRequestRepository withdrawalRequestRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<ApproveWithdrawalCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ApproveWithdrawalCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } adminId || !currentUser.IsInRole(RoleConstants.Admin))
        {
            return Error.Forbidden("Withdrawal.Forbidden", "Only admins can approve withdrawals.");
        }

        var withdrawal = await withdrawalRequestRepository.GetByIdAsync(request.Id, cancellationToken);
        if (withdrawal is null)
        {
            return Error.NotFound("Withdrawal.NotFound", "Withdrawal request not found.");
        }

        if (withdrawal.Status != WithdrawalStatus.Pending)
        {
            return Error.Validation("Withdrawal.NotPending", "Only pending requests can be approved.");
        }

        withdrawal.Approve(adminId);
        withdrawalRequestRepository.Update(withdrawal);

        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}
