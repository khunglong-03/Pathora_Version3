using Application.Common.Interfaces;
using Application.Common.Constant;
using Domain.Common.Repositories;
using Domain.Constant;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Commands.ConfirmWithdrawalTransfer;

public sealed class ConfirmWithdrawalTransferCommandHandler(
    ICurrentUser currentUser,
    IWithdrawalRequestRepository withdrawalRequestRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<ConfirmWithdrawalTransferCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ConfirmWithdrawalTransferCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is null || !currentUser.IsInRole(RoleConstants.Admin))
        {
            return Error.Forbidden("Withdrawal.Forbidden", "Only admins can confirm withdrawal transfers.");
        }

        var withdrawal = await withdrawalRequestRepository.GetByIdAsync(request.Id, cancellationToken);
        if (withdrawal is null)
        {
            return Error.NotFound("Withdrawal.NotFound", "Withdrawal request not found.");
        }

        if (withdrawal.Status != WithdrawalStatus.Approved)
        {
            return Error.Validation("Withdrawal.NotApproved", "Only approved requests can be confirmed.");
        }

        withdrawal.ConfirmTransfer();
        withdrawalRequestRepository.Update(withdrawal);

        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}
