namespace Contracts;

public sealed record UserBankAccountDto(
    Guid UserId,
    string Username,
    string? FullName,
    string Email,
    string? BankAccountNumber,
    string? BankCode,
    string? BankAccountName,
    bool BankAccountVerified,
    DateTimeOffset? BankAccountVerifiedAt
);
