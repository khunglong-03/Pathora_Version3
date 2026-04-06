namespace Application.Dtos;

public sealed record TourDayActivityResourceLinkDto(
    Guid Id,
    string Url,
    int Order
);
