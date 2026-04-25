using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Manager.Queries.GetMyBankAccount;
public sealed record GetMyBankAccountQuery()
    : IQuery<ErrorOr<ManagerBankAccountDto>>;


public sealed class GetMyBankAccountQueryHandler(
    IManagerBankAccountRepository bankAccountRepository,
    ICurrentUser currentUser)
    : IQueryHandler<GetMyBankAccountQuery, ErrorOr<ManagerBankAccountDto>>
{
    public async Task<ErrorOr<ManagerBankAccountDto>> Handle(
        GetMyBankAccountQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.Id
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        // Get the default bank account, or first account if no default
        var account = await bankAccountRepository.GetDefaultByUserIdAsync(userId, cancellationToken);
        account ??= (await bankAccountRepository.GetByUserIdAsync(userId, cancellationToken)).FirstOrDefault();

        if (account is null)
        {
            return new ManagerBankAccountDto(
                UserId: userId,
                BankAccountNumber: null,
                BankCode: null,
                BankAccountName: null,
                BankAccountVerified: false,
                BankAccountVerifiedAt: null
            );
        }

        return new ManagerBankAccountDto(
            UserId: account.UserId,
            BankAccountNumber: account.BankAccountNumber,
            BankCode: account.BankCode,
            BankAccountName: account.BankAccountName,
            BankAccountVerified: account.IsVerified,
            BankAccountVerifiedAt: account.VerifiedAt
        );
    }
}
