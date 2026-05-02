using ErrorOr;
using MediatR;
using Domain.Enums;

namespace Application.Features.Withdrawal.Queries.GetWithdrawalDetail;

public sealed record GetWithdrawalDetailQuery(Guid Id) : IRequest<ErrorOr<WithdrawalDetailDto>>;

public sealed record WithdrawalDetailDto(
    Guid Id,
    Guid UserId,
    string? ManagerName,
    string? ManagerEmail,
    decimal Amount,
    WithdrawalStatus Status,
    string BankAccountNumber,
    string BankCode,
    string BankBin,
    string? BankShortName,
    string? BankAccountName,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ApprovedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset? RejectedAt,
    DateTimeOffset? CancelledAt,
    string? RejectionReason,
    string? AdminNote
);
