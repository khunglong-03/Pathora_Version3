namespace Application.Features.Admin.DTOs;

using Domain.Enums;

public sealed record UserListItemDto(
    Guid Id,
    string Username,
    string? FullName,
    string Email,
    string? PhoneNumber,
    string? AvatarUrl,
    UserStatus Status,
    VerifyStatus VerifyStatus,
    List<string> Roles
);
