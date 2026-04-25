using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using FluentValidation;
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


public sealed class GetManagersBankAccountQueryValidator : AbstractValidator<GetManagersBankAccountQuery>
{
    public GetManagersBankAccountQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page must be at least 1.");

        RuleFor(x => x.Limit)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Limit must be at least 1.")
            .LessThanOrEqualTo(100)
            .WithMessage("Limit cannot exceed 100.");
    }
}
