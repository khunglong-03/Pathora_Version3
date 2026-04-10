namespace Application.Features.AdminHotelBookings.DTOs;

using Domain.Enums;

public sealed record AdminHotelBookingDto(
    Guid BookingId,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    string TourName,
    DateTimeOffset DepartureDate,
    int DurationDays,
    BookingStatus Status,
    List<AdminAccommodationDetailDto> AccommodationDetails);

public sealed record AdminAccommodationDetailDto(
    Guid DetailId,
    Guid BookingActivityReservationId,
    string AccommodationName,
    RoomType RoomType,
    int RoomCount,
    DateTimeOffset? CheckInAt,
    DateTimeOffset? CheckOutAt,
    decimal BuyPrice,
    ReservationStatus Status);
