using Application.Common.Interfaces;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;
using Contracts;

namespace Application.Features.Withdrawal.Queries.GetManagerWithdrawals;

public sealed class GetManagerWithdrawalsQueryHandler(
    ICurrentUser currentUser,
    IWithdrawalRequestRepository withdrawalRequestRepository) : IRequestHandler<GetManagerWithdrawalsQuery, ErrorOr<PaginatedList<WithdrawalSummaryDto>>>
{
    public async Task<ErrorOr<PaginatedList<WithdrawalSummaryDto>>> Handle(GetManagerWithdrawalsQuery request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Error.Unauthorized();
        }

        var totalCount = await withdrawalRequestRepository.CountByUserIdAsync(userId, request.Status, cancellationToken);
        
        var requests = await withdrawalRequestRepository.GetByUserIdAsync(
            userId, 
            request.Status, 
            request.Page, 
            request.PageSize, 
            cancellationToken);

        var items = requests.Select(x => new WithdrawalSummaryDto(
            x.Id,
            x.Amount,
            x.Status,
            x.BankAccountNumber,
            x.BankShortName,
            x.BankAccountName,
            x.CreatedOnUtc,
            x.ApprovedAt,
            x.CompletedAt,
            x.RejectedAt,
            x.CancelledAt,
            x.RejectionReason)).ToList();

        return new PaginatedList<WithdrawalSummaryDto>(totalCount, items, request.Page, request.PageSize);
    }
}
