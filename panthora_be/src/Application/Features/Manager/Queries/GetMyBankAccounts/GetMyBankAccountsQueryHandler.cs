using Application.Common.Interfaces;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;

namespace Application.Features.Manager.Queries.GetMyBankAccounts;

public sealed class GetMyBankAccountsQueryHandler(
    IManagerBankAccountRepository bankAccountRepository,
    ICurrentUser currentUser)
    : IQueryHandler<GetMyBankAccountsQuery, ErrorOr<List<ManagerBankAccountItemDto>>>
{
    public async Task<ErrorOr<List<ManagerBankAccountItemDto>>> Handle(
        GetMyBankAccountsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.Id
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var entities = await bankAccountRepository.GetByUserIdAsync(userId, cancellationToken);

        var accounts = entities.Select(a => new ManagerBankAccountItemDto(
            a.Id,
            a.UserId,
            a.BankAccountNumber,
            a.BankCode,
            a.BankBin,
            a.BankShortName,
            a.BankAccountName,
            a.IsDefault,
            a.IsVerified,
            a.VerifiedAt,
            a.CreatedOnUtc)).ToList();

        return accounts;
    }
}
