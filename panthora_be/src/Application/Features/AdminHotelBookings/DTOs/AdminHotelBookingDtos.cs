using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.AdminHotelBookings.DTOs;
public sealed record AdminHotelBookingDto(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("customerName")] string CustomerName,
    [property: JsonPropertyName("customerPhone")] string CustomerPhone,
    [property: JsonPropertyName("customerEmail")] string? CustomerEmail,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("departureDate")] DateTimeOffset DepartureDate,
    [property: JsonPropertyName("durationDays")] int DurationDays,
    [property: JsonPropertyName("status")] BookingStatus Status,
    [property: JsonPropertyName("accommodationDetails")] List<AdminAccommodationDetailDto> AccommodationDetails);

public sealed record AdminAccommodationDetailDto(
    [property: JsonPropertyName("detailId")] Guid DetailId,
    [property: JsonPropertyName("bookingActivityReservationId")] Guid BookingActivityReservationId,
    [property: JsonPropertyName("accommodationName")] string AccommodationName,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("roomCount")] int RoomCount,
    [property: JsonPropertyName("checkInAt")] DateTimeOffset? CheckInAt,
    [property: JsonPropertyName("checkOutAt")] DateTimeOffset? CheckOutAt,
    [property: JsonPropertyName("buyPrice")] decimal BuyPrice,
    [property: JsonPropertyName("status")] ReservationStatus Status);
