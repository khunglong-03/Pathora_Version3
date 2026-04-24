using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Admin.Queries.GetManagersBankAccount;

public sealed record GetManagersBankAccountQuery(
    [property: JsonPropertyName("role")] string? Role,
    [property: JsonPropertyName("searchQuery")] string? SearchQuery,
    [property: JsonPropertyName("page")] int Page = 1,
    [property: JsonPropertyName("limit")] int Limit = 50) : IQuery<ErrorOr<PaginatedResult<UserBankAccountDto>>>
{
}

public sealed record PaginatedResult<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int Limit);
