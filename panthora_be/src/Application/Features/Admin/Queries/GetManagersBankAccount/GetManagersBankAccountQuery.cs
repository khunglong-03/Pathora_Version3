using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Admin.Queries.GetManagersBankAccount;

public sealed record GetManagersBankAccountQuery(
    string? Role,
    string? SearchQuery,
    int Page = 1,
    int Limit = 50
) : IQuery<ErrorOr<PaginatedResult<UserBankAccountDto>>>
{
}

public sealed record PaginatedResult<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int Limit);
