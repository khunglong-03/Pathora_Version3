using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourRequestVm(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("destination")] string Destination,
    [property: JsonPropertyName("startDate")] DateTimeOffset StartDate,
    [property: JsonPropertyName("endDate")] DateTimeOffset EndDate,
    [property: JsonPropertyName("numberOfParticipants")] int NumberOfParticipants,
    [property: JsonPropertyName("budgetPerPersonUsd")] decimal BudgetPerPersonUsd,
    [property: JsonPropertyName("travelInterests")] List<string> TravelInterests,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("adminNote")] string? AdminNote,
    [property: JsonPropertyName("reviewedAt")] DateTimeOffset? ReviewedAt);

public sealed record TourRequestDetailDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("userId")] Guid? UserId,
    [property: JsonPropertyName("customerName")] string CustomerName,
    [property: JsonPropertyName("customerPhone")] string CustomerPhone,
    [property: JsonPropertyName("customerEmail")] string? CustomerEmail,
    [property: JsonPropertyName("destination")] string Destination,
    [property: JsonPropertyName("startDate")] DateTimeOffset StartDate,
    [property: JsonPropertyName("endDate")] DateTimeOffset EndDate,
    [property: JsonPropertyName("numberOfParticipants")] int NumberOfParticipants,
    [property: JsonPropertyName("budgetPerPersonUsd")] decimal BudgetPerPersonUsd,
    [property: JsonPropertyName("travelInterests")] List<string> TravelInterests,
    [property: JsonPropertyName("preferredAccommodation")] string? PreferredAccommodation,
    [property: JsonPropertyName("transportationPreference")] string? TransportationPreference,
    [property: JsonPropertyName("specialRequests")] string? SpecialRequests,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("adminNote")] string? AdminNote,
    [property: JsonPropertyName("reviewedBy")] Guid? ReviewedBy,
    [property: JsonPropertyName("reviewedAt")] DateTimeOffset? ReviewedAt,
    [property: JsonPropertyName("createdBy")] string? CreatedBy,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedBy")] string? LastModifiedBy,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc,
    [property: JsonPropertyName("tourInstanceId")] Guid? TourInstanceId);
