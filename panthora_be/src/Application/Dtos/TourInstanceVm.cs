namespace Application.Dtos;

public sealed record TourInstanceVm(
    Guid Id,
    Guid TourId,
    string TourInstanceCode,
    string Title,
    string TourName,
    string TourCode,
    string ClassificationName,
    string? Location,
    ImageDto? Thumbnail,
    List<ImageDto> Images,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    int DurationDays,
    int CurrentParticipation,
    int MaxParticipation,
    decimal BasePrice,
    string Status,
    string InstanceType);
