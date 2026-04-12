namespace Application.Contracts.Manager;

public sealed record UpdateManagerBankAccountRequest(
    string BankAccountNumber,
    string BankCode,
    string BankBin,
    string? BankShortName,
    string? BankAccountName,
    bool IsDefault
);
