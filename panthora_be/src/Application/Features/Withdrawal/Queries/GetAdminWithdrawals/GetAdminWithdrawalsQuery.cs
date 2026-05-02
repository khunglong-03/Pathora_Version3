using Domain.Enums;
using ErrorOr;
using MediatR;
using Contracts;

namespace Application.Features.Withdrawal.Queries.GetAdminWithdrawals;

public sealed record GetAdminWithdrawalsQuery(
    WithdrawalStatus? Status,
    string? Search,
    int Page = 1,
    int PageSize = 10) : IRequest<ErrorOr<PaginatedList<AdminWithdrawalSummaryDto>>>;

public sealed record AdminWithdrawalSummaryDto(
    Guid Id,
    Guid UserId,
    string? ManagerName,
    string? ManagerEmail,
    decimal Amount,
    WithdrawalStatus Status,
    string BankAccountNumber,
    string? BankShortName,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ApprovedAt
);
