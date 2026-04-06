namespace Application.Dtos;

public sealed record TourInstanceManagerDto(
    Guid Id,
    Guid UserId,
    string UserName,
    string? UserAvatar,
    string Role);
