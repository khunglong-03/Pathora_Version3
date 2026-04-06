using Application.Contracts.Booking;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using ErrorOr;

namespace Application.Features.BookingManagement.Queries;

public sealed class GetAllBookingsQueryHandler(
    IBookingRepository bookingRepository)
    : IQueryHandler<GetAllBookingsQuery, ErrorOr<AdminBookingListResult>>
{
    public async Task<ErrorOr<AdminBookingListResult>> Handle(
        GetAllBookingsQuery request,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Min(Math.Max(1, request.PageSize), 100);

        var (items, totalCount) = await bookingRepository.GetAllPagedAsync(page, pageSize);

        var response = items.Select(b => new AdminBookingListResponse(
            b.Id,
            b.CustomerName,
            b.TourInstance.TourName,
            b.TourInstance.StartDate,
            b.TotalPrice,
            b.Status.ToString()
        )).ToList();

        return new AdminBookingListResult(response, totalCount);
    }
}
