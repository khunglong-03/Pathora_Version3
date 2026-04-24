using System.Text.Json.Serialization;

namespace Application.Contracts.Public;

public sealed record FeaturedTourVm(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("thumbnail")] string? Thumbnail,
    [property: JsonPropertyName("location")] string? Location,
    [property: JsonPropertyName("rating")] decimal? Rating,
    [property: JsonPropertyName("durationDays")] int DurationDays,
    [property: JsonPropertyName("basePrice")] decimal BasePrice,
    [property: JsonPropertyName("reviewRating")] decimal? ReviewRating,
    [property: JsonPropertyName("classificationName")] string? ClassificationName,
    [property: JsonPropertyName("isVisa")] bool IsVisa = false);

public sealed record LatestTourVm(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("thumbnail")] string? Thumbnail,
    [property: JsonPropertyName("shortDescription")] string? ShortDescription,
    [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt,
    [property: JsonPropertyName("isVisa")] bool IsVisa = false);

public sealed record TrendingDestinationVm(
    [property: JsonPropertyName("city")] string City,
    [property: JsonPropertyName("country")] string Country,
    [property: JsonPropertyName("imageUrl")] string? ImageUrl,
    [property: JsonPropertyName("toursCount")] int ToursCount);

public sealed record TopAttractionVm(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("location")] string? Location,
    [property: JsonPropertyName("imageUrl")] string? ImageUrl,
    [property: JsonPropertyName("city")] string City,
    [property: JsonPropertyName("country")] string Country);

public sealed record HomeStatsVm(
    [property: JsonPropertyName("totalTravelers")] int TotalTravelers,
    [property: JsonPropertyName("totalTours")] int TotalTours,
    [property: JsonPropertyName("totalDistanceKm")] decimal TotalDistanceKm);

public sealed record TopReviewVm(
    [property: JsonPropertyName("userName")] string UserName,
    [property: JsonPropertyName("userAvatar")] string? UserAvatar,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("rating")] int Rating,
    [property: JsonPropertyName("comment")] string? Comment,
    [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt);

public sealed record SearchTourVm(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("thumbnail")] string? Thumbnail,
    [property: JsonPropertyName("shortDescription")] string? ShortDescription,
    [property: JsonPropertyName("location")] string? Location,
    [property: JsonPropertyName("durationDays")] int DurationDays,
    [property: JsonPropertyName("basePrice")] decimal BasePrice,
    [property: JsonPropertyName("classificationName")] string? ClassificationName,
    [property: JsonPropertyName("rating")] decimal? Rating,
    [property: JsonPropertyName("isVisa")] bool IsVisa = false);
