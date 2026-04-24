using System.Text.Json.Serialization;

namespace Application.Contracts.Manager;

public sealed record UpdateMyBankAccountRequest(
    [property: JsonPropertyName("bankAccountNumber")] string BankAccountNumber,
    [property: JsonPropertyName("bankCode")] string BankCode,
    [property: JsonPropertyName("bankAccountName")] string? BankAccountName);
