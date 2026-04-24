using System.Text.Json.Serialization;

namespace Application.Contracts.Manager;

public sealed record CreateManagerBankAccountRequest(
    [property: JsonPropertyName("bankAccountNumber")] string BankAccountNumber,
    [property: JsonPropertyName("bankCode")] string BankCode,
    [property: JsonPropertyName("bankBin")] string BankBin,
    [property: JsonPropertyName("bankShortName")] string? BankShortName,
    [property: JsonPropertyName("bankAccountName")] string? BankAccountName,
    [property: JsonPropertyName("isDefault")] bool IsDefault);
