namespace Application.Dtos;

public sealed record TourInstanceDayDto(
    Guid Id,
    int InstanceDayNumber,
    DateTimeOffset ActualDate,
    string Title,
    string? Description,
    TimeOnly? StartTime,
    TimeOnly? EndTime,
    string? Note,
    TourDayDto TourDay);
