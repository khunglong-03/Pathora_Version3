using Application.Contracts.Booking;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.BookingManagement.Queries;

public sealed record GetAllBookingsQuery(int Page = 1, int PageSize = 20)
    : IQuery<ErrorOr<AdminBookingListResult>>;
