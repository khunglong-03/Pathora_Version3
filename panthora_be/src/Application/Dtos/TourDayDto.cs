using Domain.Entities.Translations;

namespace Application.Dtos;

public sealed record TourDayDto(
    Guid Id,
    Guid ClassificationId,
    int DayNumber,
    string Title,
    string? Description,
    List<TourDayActivityDto> Activities,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset? LastModifiedOnUtc,
    Dictionary<string, TourDayTranslationData>? Translations = null
);
