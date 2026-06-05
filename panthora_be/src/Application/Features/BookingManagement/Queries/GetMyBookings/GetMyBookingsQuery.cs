using Contracts.ModelResponse;
using Domain.Enums;
using ErrorOr;
using MediatR;

namespace Application.Features.BookingManagement.Queries.GetMyBookings;

public sealed record MyBookingDto(
    Guid Id,
    string TourName,
    Guid TourInstanceId,
    string Reference,
    BookingStatus Status,
    string TourStatus,
    PaymentStatus PaymentStatus,
    decimal TotalPrice,
    decimal PaidAmount,
    decimal RemainingBalance,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    string Location,
    string? ThumbnailUrl,
    int Adults,
    int Children,
    int Infants,
    DateTimeOffset CreatedAt,
    // Breakdown fields (task 3.1)
    decimal AdultUnitPrice = 0m,
    decimal ChildUnitPrice = 0m,
    decimal InfantUnitPrice = 0m,
    decimal Subtotal = 0m,
    decimal TaxAmount = 0m,
    decimal TotalAmount = 0m,
    decimal RemainingBalance = 0m
);

public sealed record MyBookingListResult(
    [property: System.Text.Json.Serialization.JsonPropertyName("items")] System.Collections.Generic.List<MyBookingDto> Items,
    [property: System.Text.Json.Serialization.JsonPropertyName("totalCount")] int TotalCount
);

public sealed record GetMyBookingsQuery(
    int Page,
    int PageSize,
    string? StatusFilter
) : IRequest<ErrorOr<MyBookingListResult>>;
