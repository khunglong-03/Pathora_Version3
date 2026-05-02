using System.Text.Json.Serialization;

namespace Application.Contracts.Admin;

public sealed record UpdateBankAccountRequest(
    [property: JsonPropertyName("bankAccountNumber")] string BankAccountNumber,
    [property: JsonPropertyName("bankCode")] string BankCode,
    [property: JsonPropertyName("bankAccountName")] string? BankAccountName
);
