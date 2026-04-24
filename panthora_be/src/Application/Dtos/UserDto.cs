using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record UserDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("fullName")] string? FullName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("avatar")] string? Avatar,
    [property: JsonPropertyName("forcePasswordChange")] bool ForcePasswordChange,
    [property: JsonPropertyName("isDeleted")] bool IsDeleted,
    [property: JsonPropertyName("createdBy")] string? CreatedBy,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedBy")] string? LastModifiedBy,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc
);
