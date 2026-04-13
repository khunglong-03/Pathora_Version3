using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;

namespace Application.Features.Admin.Queries.GetManagersBankAccount;

public sealed class GetManagersBankAccountQueryHandler(
    IManagerBankAccountRepository bankAccountRepository)
    : IQueryHandler<GetManagersBankAccountQuery, ErrorOr<PaginatedResult<UserBankAccountDto>>>
{
    public async Task<ErrorOr<PaginatedResult<UserBankAccountDto>>> Handle(
        GetManagersBankAccountQuery request,
        CancellationToken cancellationToken)
    {
        var accounts = await bankAccountRepository.GetAllWithUserAsync(
            search: request.SearchQuery,
            pageNumber: request.Page,
            pageSize: request.Limit,
            ct: cancellationToken);

        var total = await bankAccountRepository.CountAllAsync(
            search: request.SearchQuery,
            ct: cancellationToken);

        var dtos = accounts.Select(a => new UserBankAccountDto(
            UserId: a.UserId,
            Username: a.User.Username,
            FullName: a.User.FullName,
            Email: a.User.Email,
            BankAccountNumber: MaskAccount(a.BankAccountNumber),
            BankCode: a.BankCode,
            BankAccountName: a.BankAccountName,
            BankAccountVerified: a.IsVerified,
            BankAccountVerifiedAt: a.VerifiedAt
        )).ToList();

        return new PaginatedResult<UserBankAccountDto>(dtos, total, request.Page, request.Limit);
    }

    private static string? MaskAccount(string? accountNumber)
    {
        if (string.IsNullOrWhiteSpace(accountNumber))
            return null;

        var trimmed = accountNumber.Trim();
        return trimmed.Length <= 4
            ? new string('*', trimmed.Length)
            : $"****{trimmed[^4..]}";
    }
}
