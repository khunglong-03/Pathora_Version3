namespace Application.Dtos;

public sealed record TourRequestVm(
    Guid Id,
    string Destination,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    int NumberOfParticipants,
    decimal BudgetPerPersonUsd,
    List<string> TravelInterests,
    string Status,
    DateTimeOffset CreatedOnUtc,
    string? AdminNote,
    DateTimeOffset? ReviewedAt);

public sealed record TourRequestDetailDto(
    Guid Id,
    Guid? UserId,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    string Destination,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    int NumberOfParticipants,
    decimal BudgetPerPersonUsd,
    List<string> TravelInterests,
    string? PreferredAccommodation,
    string? TransportationPreference,
    string? SpecialRequests,
    string Status,
    string? AdminNote,
    Guid? ReviewedBy,
    DateTimeOffset? ReviewedAt,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset? LastModifiedOnUtc,
    Guid? TourInstanceId);
