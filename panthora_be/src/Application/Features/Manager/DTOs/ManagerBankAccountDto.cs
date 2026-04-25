using System.Text.Json.Serialization;

namespace Application.Features.Manager.DTOs;
public sealed record ManagerBankAccountDto(
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("bankAccountNumber")] string? BankAccountNumber,
    [property: JsonPropertyName("bankCode")] string? BankCode,
    [property: JsonPropertyName("bankAccountName")] string? BankAccountName,
    [property: JsonPropertyName("bankAccountVerified")] bool BankAccountVerified,
    [property: JsonPropertyName("bankAccountVerifiedAt")] DateTimeOffset? BankAccountVerifiedAt
);
