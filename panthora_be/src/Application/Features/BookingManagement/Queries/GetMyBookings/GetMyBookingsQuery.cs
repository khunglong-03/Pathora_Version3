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
    PaymentStatus PaymentStatus,
    decimal TotalPrice,
    decimal PaidAmount,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    string Location,
    string? ThumbnailUrl,
    int Adults,
    int Children,
    int Infants,
    DateTimeOffset CreatedAt
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
