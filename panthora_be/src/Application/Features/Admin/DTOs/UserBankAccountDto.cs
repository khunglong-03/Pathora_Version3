using System.Text.Json.Serialization;

namespace Application.Features.Admin.DTOs;
public sealed record UserBankAccountDto(
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("fullName")] string? FullName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("bankAccountNumber")] string? BankAccountNumber,
    [property: JsonPropertyName("bankCode")] string? BankCode,
    [property: JsonPropertyName("bankAccountName")] string? BankAccountName,
    [property: JsonPropertyName("bankAccountVerified")] bool BankAccountVerified,
    [property: JsonPropertyName("bankAccountVerifiedAt")] DateTimeOffset? BankAccountVerifiedAt);
