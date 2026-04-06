namespace Application.Contracts.Public;

public sealed record FeaturedTourVm(
    Guid Id,
    string TourName,
    string? Thumbnail,
    string? Location,
    decimal? Rating,
    int DurationDays,
    decimal BasePrice,
    decimal? ReviewRating,
    string? ClassificationName);

public sealed record LatestTourVm(
    Guid Id,
    string TourName,
    string? Thumbnail,
    string? ShortDescription,
    DateTimeOffset CreatedAt);

public sealed record TrendingDestinationVm(
    string City,
    string Country,
    string? ImageUrl,
    int ToursCount);

public sealed record TopAttractionVm(
    string Name,
    string? Location,
    string? ImageUrl,
    string City,
    string Country);

public sealed record HomeStatsVm(
    int TotalTravelers,
    int TotalTours,
    decimal TotalDistanceKm);

public sealed record TopReviewVm(
    string UserName,
    string? UserAvatar,
    string TourName,
    int Rating,
    string? Comment,
    DateTimeOffset CreatedAt);

public sealed record SearchTourVm(
    Guid Id,
    string TourName,
    string? Thumbnail,
    string? ShortDescription,
    string? Location,
    int DurationDays,
    decimal BasePrice,
    string? ClassificationName,
    decimal? Rating);
