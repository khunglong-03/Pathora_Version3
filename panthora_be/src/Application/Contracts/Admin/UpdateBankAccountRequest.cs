namespace Application.Contracts.Admin;

public sealed record UpdateBankAccountRequest(
    string BankAccountNumber,
    string BankCode,
    string? BankAccountName
);
