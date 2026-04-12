namespace Application.Contracts.Manager;

public sealed record CreateManagerBankAccountRequest(
    string BankAccountNumber,
    string BankCode,
    string BankBin,
    string? BankShortName,
    string? BankAccountName,
    bool IsDefault
);
