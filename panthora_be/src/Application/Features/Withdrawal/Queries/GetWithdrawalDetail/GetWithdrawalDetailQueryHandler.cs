using Application.Common.Interfaces;
using Application.Common.Constant;
using Domain.Common.Repositories;
using Domain.Constant;
using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Queries.GetWithdrawalDetail;

public sealed class GetWithdrawalDetailQueryHandler(
    ICurrentUser currentUser,
    IWithdrawalRequestRepository withdrawalRequestRepository) : IRequestHandler<GetWithdrawalDetailQuery, ErrorOr<WithdrawalDetailDto>>
{
    public async Task<ErrorOr<WithdrawalDetailDto>> Handle(GetWithdrawalDetailQuery request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Error.Unauthorized();
        }

        var withdrawal = await withdrawalRequestRepository.GetByIdWithUserAsync(request.Id, cancellationToken);
        
        if (withdrawal is null)
        {
            return Error.NotFound("Withdrawal.NotFound", "Withdrawal request not found.");
        }

        var isAdmin = currentUser.IsInRole(RoleConstants.Admin);
        
        if (withdrawal.UserId != userId && !isAdmin)
        {
            return Error.Forbidden("Withdrawal.Forbidden", "Not allowed to view this withdrawal request.");
        }

        return new WithdrawalDetailDto(
            withdrawal.Id,
            withdrawal.UserId,
            withdrawal.User?.FullName ?? withdrawal.User?.Username,
            withdrawal.User?.Email,
            withdrawal.Amount,
            withdrawal.Status,
            withdrawal.BankAccountNumber,
            withdrawal.BankCode,
            withdrawal.BankBin,
            withdrawal.BankShortName,
            withdrawal.BankAccountName,
            withdrawal.CreatedOnUtc,
            withdrawal.ApprovedAt,
            withdrawal.CompletedAt,
            withdrawal.RejectedAt,
            withdrawal.CancelledAt,
            withdrawal.RejectionReason,
            withdrawal.AdminNote
        );
    }
}
