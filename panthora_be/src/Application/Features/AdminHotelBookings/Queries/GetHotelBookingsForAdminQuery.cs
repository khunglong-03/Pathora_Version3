namespace Application.Features.AdminHotelBookings.Queries;

using Application.Features.AdminHotelBookings.DTOs;
using BuildingBlocks.CORS;
using Application.Common;
using global::Contracts;
using Domain.Enums;
using ErrorOr;

public sealed record GetHotelBookingsForAdminQuery(
    int PageNumber = 1,
    int PageSize = 20,
    BookingStatus? Status = null,
    DateTimeOffset? FromDate = null,
    DateTimeOffset? ToDate = null,
    string? SearchText = null) : IQuery<ErrorOr<PaginatedList<AdminHotelBookingDto>>>;
