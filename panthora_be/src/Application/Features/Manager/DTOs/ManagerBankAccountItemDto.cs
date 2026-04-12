namespace Application.Features.Manager.DTOs;

public sealed record ManagerBankAccountItemDto(
    Guid Id,
    Guid UserId,
    string BankAccountNumber,
    string BankCode,
    string BankBin,
    string? BankShortName,
    string? BankAccountName,
    bool IsDefault,
    bool IsVerified,
    DateTimeOffset? VerifiedAt,
    DateTimeOffset CreatedOnUtc
);
