using Application.Contracts.Booking;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using ErrorOr;

namespace Application.Features.BookingManagement.Queries;

public sealed record GetRecentBookingsQuery(int Count = 3) : IQuery<ErrorOr<List<RecentBookingResponse>>>;

public sealed class GetRecentBookingsQueryHandler(
    IUser user,
    IBookingRepository bookingRepository)
    : IQueryHandler<GetRecentBookingsQuery, ErrorOr<List<RecentBookingResponse>>>
{
    public async Task<ErrorOr<List<RecentBookingResponse>>> Handle(GetRecentBookingsQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(user.Id) || !Guid.TryParse(user.Id, out var currentUserId))
        {
            return Error.Unauthorized("Unauthorized", "User is not authenticated.");
        }

        var bookings = await bookingRepository.GetRecentByUserIdAsync(currentUserId, request.Count);

        var response = bookings.Select(b => new RecentBookingResponse(
            b.Id,
            b.TourInstance.TourName,
            b.TourInstance.StartDate,
            b.Status.ToString(),
            b.TotalPrice,
            b.NumberAdult + b.NumberChild + b.NumberInfant
        )).ToList();

        return response;
    }
}
