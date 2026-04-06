namespace Application.Dtos;

public sealed record TourInstanceGuideDto(
    string Name,
    string? AvatarUrl,
    List<string> Languages,
    string? Experience);
