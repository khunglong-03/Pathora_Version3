using Application.Common.Interfaces;
using Application.Common.Constant;
using Domain.Common.Repositories;
using Domain.Constant;
using ErrorOr;
using MediatR;
using Contracts;

namespace Application.Features.Withdrawal.Queries.GetAdminWithdrawals;

public sealed class GetAdminWithdrawalsQueryHandler(
    ICurrentUser currentUser,
    IWithdrawalRequestRepository withdrawalRequestRepository) : IRequestHandler<GetAdminWithdrawalsQuery, ErrorOr<PaginatedList<AdminWithdrawalSummaryDto>>>
{
    public async Task<ErrorOr<PaginatedList<AdminWithdrawalSummaryDto>>> Handle(GetAdminWithdrawalsQuery request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is null || !currentUser.IsInRole(RoleConstants.Admin))
        {
            return Error.Forbidden("Withdrawal.Forbidden", "Only admins can view all withdrawals.");
        }

        var totalCount = await withdrawalRequestRepository.CountAllAsync(request.Status, request.Search, cancellationToken);
        
        var requests = await withdrawalRequestRepository.GetAllAsync(
            request.Status, 
            request.Search, 
            request.Page, 
            request.PageSize, 
            cancellationToken);

        var items = requests.Select(x => new AdminWithdrawalSummaryDto(
            x.Id,
            x.UserId,
            x.User?.FullName ?? x.User?.Username,
            x.User?.Email,
            x.Amount,
            x.Status,
            x.BankAccountNumber,
            x.BankShortName,
            x.CreatedOnUtc,
            x.ApprovedAt)).ToList();

        return new PaginatedList<AdminWithdrawalSummaryDto>(totalCount, items, request.Page, request.PageSize);
    }
}
