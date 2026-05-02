using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourPlanAccommodationDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("accommodationName")] string AccommodationName,
    [property: JsonPropertyName("checkInTime")] TimeOnly? CheckInTime,
    [property: JsonPropertyName("checkOutTime")] TimeOnly? CheckOutTime,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("roomCapacity")] int RoomCapacity,
    [property: JsonPropertyName("roomPrice")] decimal? RoomPrice,
    [property: JsonPropertyName("numberOfRooms")] int? NumberOfRooms,
    [property: JsonPropertyName("numberOfNights")] int? NumberOfNights,
    [property: JsonPropertyName("totalPrice")] decimal? TotalPrice,
    [property: JsonPropertyName("mealsIncluded")] MealType MealsIncluded,
    [property: JsonPropertyName("specialRequest")] string? SpecialRequest,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("city")] string? City,
    [property: JsonPropertyName("contactPhone")] string? ContactPhone,
    [property: JsonPropertyName("website")] string? Website,
    [property: JsonPropertyName("imageUrl")] string? ImageUrl,
    [property: JsonPropertyName("latitude")] decimal? Latitude,
    [property: JsonPropertyName("longitude")] decimal? Longitude,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("createdBy")] string? CreatedBy,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedBy")] string? LastModifiedBy,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc,
    [property: JsonPropertyName("translations")] Dictionary<string, Domain.Entities.Translations.TourPlanAccommodationTranslationData>? Translations = null
);
