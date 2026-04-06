namespace Application.Features.Admin.DTOs;

using Domain.Enums;

public sealed record UserDetailDto(
    Guid Id,
    string Username,
    string? FullName,
    string Email,
    string? PhoneNumber,
    string? AvatarUrl,
    UserStatus Status,
    VerifyStatus VerifyStatus,
    List<string> Roles,
    List<BookingSummaryDto> RecentBookings
);

public sealed record BookingSummaryDto(
    Guid BookingId,
    string TourName,
    decimal TotalAmount,
    DateTimeOffset CreatedOn,
    Domain.Enums.BookingStatus Status
);
