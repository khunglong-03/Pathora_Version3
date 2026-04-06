namespace Application.Dtos;

public sealed record UserDto(
    Guid Id,
    string Username,
    string? FullName,
    string Email,
    string? Avatar,
    bool ForcePasswordChange,
    bool IsDeleted,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset? LastModifiedOnUtc
);
