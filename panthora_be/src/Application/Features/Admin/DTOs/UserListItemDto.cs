using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.Admin.DTOs;

public sealed record UserListItemDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("fullName")] string? FullName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("phoneNumber")] string? PhoneNumber,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("status")] UserStatus Status,
    [property: JsonPropertyName("verifyStatus")] VerifyStatus VerifyStatus,
    [property: JsonPropertyName("roles")] List<string> Roles,
    [property: JsonPropertyName("role")] string? Role = null);
