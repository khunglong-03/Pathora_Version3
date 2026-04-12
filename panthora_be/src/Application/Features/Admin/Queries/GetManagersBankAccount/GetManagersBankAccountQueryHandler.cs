using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;

namespace Application.Features.Admin.Queries.GetManagersBankAccount;

public sealed class GetManagersBankAccountQueryHandler(
    IUserRepository userRepository)
    : IQueryHandler<GetManagersBankAccountQuery, ErrorOr<PaginatedResult<UserBankAccountDto>>>
{
    public async Task<ErrorOr<PaginatedResult<UserBankAccountDto>>> Handle(
        GetManagersBankAccountQuery request,
        CancellationToken cancellationToken)
    {
        const int ManagerRoleId = 2; // Manager role

        var users = await userRepository.FindProvidersByRoleAsync(
            roleId: ManagerRoleId,
            search: request.SearchQuery,
            status: null,
            pageNumber: request.Page,
            pageSize: request.Limit,
            cancellationToken: cancellationToken);

        var total = await userRepository.CountProvidersByRoleAsync(
            roleId: ManagerRoleId,
            search: request.SearchQuery,
            status: null,
            cancellationToken: cancellationToken);

        var dtos = users.Select(u => new UserBankAccountDto(
            UserId: u.Id,
            Username: u.Username,
            FullName: u.FullName,
            Email: u.Email,
            BankAccountNumber: MaskAccount(u.BankAccountNumber),
            BankCode: u.BankCode,
            BankAccountName: u.BankAccountName,
            BankAccountVerified: u.BankAccountVerified,
            BankAccountVerifiedAt: u.BankAccountVerifiedAt
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
