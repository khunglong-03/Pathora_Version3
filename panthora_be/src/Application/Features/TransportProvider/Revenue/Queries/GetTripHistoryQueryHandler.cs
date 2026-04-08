namespace Application.Features.TransportProvider.Revenue.Queries;

using Application.Features.TransportProvider.Revenue.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;

public sealed class GetTripHistoryQueryHandler(
        ITourDayActivityRouteTransportRepository repository)
    : IQueryHandler<GetTripHistoryQuery, ErrorOr<TripHistoryResponseDto>>
{
    private const long RevenuePerTrip = 1_000_000L;

    public async Task<ErrorOr<TripHistoryResponseDto>> Handle(
        GetTripHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var items = await repository.FindCompletedByOwnerIdPaginatedAsync(
            request.CurrentUserId,
            request.Year,
            request.Quarter,
            request.Page,
            request.PageSize,
            cancellationToken);

        var total = await repository.CountCompletedByOwnerIdAsync(
            request.CurrentUserId,
            request.Year,
            request.Quarter,
            cancellationToken);

        var result = items.Select(rt => new TripHistoryItemDto(
            rt.Id,
            rt.BookingActivityReservation?.BookingId.ToString() ?? string.Empty,
            rt.TourPlanRoute?.TransportationName ?? rt.TourPlanRoute?.TransportationType.ToString() ?? string.Empty,
            rt.UpdatedAt,
            rt.Vehicle?.VehiclePlate ?? string.Empty,
            rt.Driver?.FullName ?? string.Empty,
            RevenuePerTrip)).ToList();

        var totalPages = (int)Math.Ceiling((double)total / request.PageSize);

        return new TripHistoryResponseDto(result, total, request.Page, request.PageSize, totalPages);
    }
}