using System.Text.Json.Serialization;

namespace Application.Features.Manager.DTOs;

public sealed record ManagerBankAccountItemDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("bankAccountNumber")] string BankAccountNumber,
    [property: JsonPropertyName("bankCode")] string BankCode,
    [property: JsonPropertyName("bankBin")] string BankBin,
    [property: JsonPropertyName("bankShortName")] string? BankShortName,
    [property: JsonPropertyName("bankAccountName")] string? BankAccountName,
    [property: JsonPropertyName("isDefault")] bool IsDefault,
    [property: JsonPropertyName("isVerified")] bool IsVerified,
    [property: JsonPropertyName("verifiedAt")] DateTimeOffset? VerifiedAt,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc);
