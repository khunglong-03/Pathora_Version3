using Domain.Enums;
using ErrorOr;
using MediatR;
using Contracts;

namespace Application.Features.Withdrawal.Queries.GetManagerWithdrawals;

public sealed record GetManagerWithdrawalsQuery(
    WithdrawalStatus? Status,
    int Page = 1,
    int PageSize = 10) : IRequest<ErrorOr<PaginatedList<WithdrawalSummaryDto>>>;

public sealed record WithdrawalSummaryDto(
    Guid Id,
    decimal Amount,
    WithdrawalStatus Status,
    string BankAccountNumber,
    string? BankShortName,
    string? BankAccountName,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ApprovedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset? RejectedAt,
    DateTimeOffset? CancelledAt,
    string? RejectionReason
);
