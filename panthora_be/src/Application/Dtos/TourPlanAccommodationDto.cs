using Domain.Enums;

namespace Application.Dtos;

public sealed record TourPlanAccommodationDto(
    Guid Id,
    string AccommodationName,
    TimeOnly? CheckInTime,
    TimeOnly? CheckOutTime,
    RoomType RoomType,
    int RoomCapacity,
    decimal? RoomPrice,
    int? NumberOfRooms,
    int? NumberOfNights,
    decimal? TotalPrice,
    MealType MealsIncluded,
    string? SpecialRequest,
    string? Address,
    string? City,
    string? ContactPhone,
    string? Website,
    string? ImageUrl,
    decimal? Latitude,
    decimal? Longitude,
    string? Note,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset? LastModifiedOnUtc
);
