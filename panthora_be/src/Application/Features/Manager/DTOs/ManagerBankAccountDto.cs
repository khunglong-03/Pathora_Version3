namespace Application.Features.Manager.DTOs;

public sealed record ManagerBankAccountDto(
    Guid UserId,
    string? BankAccountNumber,
    string? BankCode,
    string? BankAccountName,
    bool BankAccountVerified,
    DateTimeOffset? BankAccountVerifiedAt
);
