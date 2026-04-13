using Application.Dtos;

namespace Application.Features.Tour.Queries;

public sealed record TourVm(
    Guid Id,
    string TourCode,
    string TourName,
    string ShortDescription,
    string Status,
    ImageDto? Thumbnail,
    DateTimeOffset CreatedOnUtc);
