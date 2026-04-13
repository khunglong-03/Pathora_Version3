namespace Application.Features.AdminHotelBookings.Queries;

using Application.Features.AdminHotelBookings.DTOs;
using BuildingBlocks.CORS;
using global::Contracts;
using Domain.Common.Repositories;
using ErrorOr;

public sealed class GetHotelBookingsForAdminQueryHandler(
    IBookingRepository bookingRepository,
    IBookingActivityReservationRepository activityRepository,
    IBookingAccommodationDetailRepository accommodationDetailRepository)
    : IQueryHandler<GetHotelBookingsForAdminQuery, ErrorOr<PaginatedList<AdminHotelBookingDto>>>
{
    public async Task<ErrorOr<PaginatedList<AdminHotelBookingDto>>> Handle(
        GetHotelBookingsForAdminQuery request,
        CancellationToken cancellationToken)
    {
        var (bookings, totalCount) = await bookingRepository.GetAllPagedAsync(
            request.PageNumber, request.PageSize, cancellationToken);

        var result = new List<AdminHotelBookingDto>();

        foreach (var booking in bookings)
        {
            var activities = await activityRepository.GetByBookingIdAsync(booking.Id, cancellationToken);

            foreach (var activity in activities)
            {
                var details = await accommodationDetailRepository.GetByBookingActivityReservationIdAsync(activity.Id, cancellationToken);

                result.AddRange(details.Select(detail => new AdminHotelBookingDto(booking.Id, booking.CustomerName, booking.CustomerPhone, booking.CustomerEmail, booking.TourInstance?.Title ?? "-", booking.TourInstance?.StartDate ?? DateTimeOffset.MinValue, booking.TourInstance?.DurationDays ?? 0, booking.Status, [new AdminAccommodationDetailDto(detail.Id, detail.BookingActivityReservationId, detail.AccommodationName, detail.RoomType, detail.RoomCount, detail.CheckInAt, detail.CheckOutAt, detail.BuyPrice, detail.Status)])));
            }
        }

        return new PaginatedList<AdminHotelBookingDto>(totalCount, result, request.PageNumber, request.PageSize);
    }
}
