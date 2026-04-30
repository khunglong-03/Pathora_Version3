using Application.Contracts.Booking;
using Application.Features.BookingManagement.Queries;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using ErrorOr;

namespace Application.Features.BookingManagement.Handlers;

public sealed class GetBookingsByTourInstanceQueryHandler(
    IBookingRepository bookingRepository,
    ITourInstanceRepository tourInstanceRepository,
    ITourRepository tourRepository,
    IUser user)
    : IQueryHandler<GetBookingsByTourInstanceQuery, ErrorOr<List<AdminBookingListResponse>>>
{
    public async Task<ErrorOr<List<AdminBookingListResponse>>> Handle(GetBookingsByTourInstanceQuery request, CancellationToken cancellationToken)
    {
        // Verify tour instance exists and user (if guide) is assigned
        var tourInstance = await tourInstanceRepository.FindById(request.TourInstanceId);
        if (tourInstance is null)
        {
            return Error.NotFound("TourInstance.NotFound", "Tour instance not found.");
        }

        // Check access: admin/manager can access all; guides can only access if assigned to this instance
        var isAdminOrManager = user.Roles.Any(r =>
            string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r, "Manager", StringComparison.OrdinalIgnoreCase));

        if (!isAdminOrManager)
        {
            if (!Guid.TryParse(user.Id, out var currentUserId))
            {
                return Error.NotFound("TourInstance.NotFound", "Tour instance not found.");
            }

            var isTourOperator = user.Roles.Any(r => string.Equals(r, "TourOperator", StringComparison.OrdinalIgnoreCase));
            if (isTourOperator)
            {
                var tour = await tourRepository.FindById(tourInstance.TourId, asNoTracking: true, cancellationToken);
                if (tour is null || tour.TourOperatorId != currentUserId)
                {
                    return Error.NotFound("TourInstance.NotFound", "Tour instance not found.");
                }
            }
            else
            {
                var isAssignedGuide = await tourInstanceRepository.HasGuideAssignmentAsync(request.TourInstanceId, currentUserId, cancellationToken);
                if (!isAssignedGuide)
                {
                    return Error.NotFound("TourInstance.NotFound", "Tour instance not found.");
                }
            }
        }

        var bookings = await bookingRepository.GetByTourInstanceIdAsync(request.TourInstanceId, cancellationToken);
        var result = bookings.Select(b => new AdminBookingListResponse(
            b.Id,
            b.CustomerName,
            b.TourInstance.TourName,
            b.TourInstance.StartDate,
            b.TotalPrice,
            b.Status.ToString(),
            b.NumberAdult,
            b.NumberChild,
            b.NumberInfant
        )).ToList();

        return result;
    }
}
