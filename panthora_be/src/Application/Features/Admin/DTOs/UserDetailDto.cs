namespace Application.Features.Admin.DTOs;

using Domain.Enums;
using System.Text.Json.Serialization;

public sealed record UserDetailDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("fullName")] string? FullName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("phoneNumber")] string? PhoneNumber,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("status")] UserStatus Status,
    [property: JsonPropertyName("verifyStatus")] VerifyStatus VerifyStatus,
    [property: JsonPropertyName("roles")] List<string> Roles,
    [property: JsonPropertyName("recentBookings")] List<BookingSummaryDto> RecentBookings);

public sealed record BookingSummaryDto(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("totalAmount")] decimal TotalAmount,
    [property: JsonPropertyName("createdOn")] DateTimeOffset CreatedOn,
    [property: JsonPropertyName("status")] Domain.Enums.BookingStatus Status);
