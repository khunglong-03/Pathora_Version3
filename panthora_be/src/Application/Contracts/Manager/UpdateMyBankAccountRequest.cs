namespace Application.Contracts.Manager;

public sealed record UpdateMyBankAccountRequest(
    string BankAccountNumber,
    string BankCode,
    string? BankAccountName
);
