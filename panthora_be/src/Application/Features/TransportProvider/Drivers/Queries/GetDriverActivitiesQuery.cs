namespace Application.Features.TransportProvider.Drivers.Queries;

using Application.Features.TransportProvider.Drivers.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;
using System.Text.Json.Serialization;
using global::Contracts;


public sealed record GetDriverActivitiesQuery(
    [property: JsonPropertyName("providerId")] Guid ProviderId,
    [property: JsonPropertyName("driverId")] Guid DriverId,
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 50)
    : IQuery<ErrorOr<PaginatedList<DriverActivityResponseDto>>>;


public sealed class GetDriverActivitiesQueryHandler(
    ITourDayActivityRouteTransportRepository repository,
    IDriverRepository driverRepository)
    : IRequestHandler<GetDriverActivitiesQuery, ErrorOr<PaginatedList<DriverActivityResponseDto>>>
{
    public async Task<ErrorOr<PaginatedList<DriverActivityResponseDto>>> Handle(
        GetDriverActivitiesQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Verify driver belongs to provider
        var driver = await driverRepository.FindByIdAndUserIdAsync(request.DriverId, request.ProviderId, cancellationToken);
        if (driver == null)
        {
            return Error.NotFound("Driver.NotFound", "Driver not found for this provider.");
        }

        // 2. Fetch paginated activities
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var total = await repository.CountByDriverIdAsync(request.DriverId, cancellationToken);
        var activities = await repository.FindByDriverIdPaginatedAsync(request.DriverId, pageNumber, pageSize, cancellationToken);

        // 3. Map to DTOs
        var items = activities.Select(a => new DriverActivityResponseDto(
            a.Id,
            a.BookingActivityReservationId,
            a.BookingActivityReservation?.Title ?? "Unknown Booking",
            a.BookingActivityReservation?.Note,
            a.TourDayActivityId,
            a.TourDayActivity?.Title ?? "Unknown Activity",
            a.TourDayActivity?.Description,
            a.TourDayActivity?.StartTime.HasValue == true
                ? a.BookingActivityReservation?.StartTime?.Date.Add(a.TourDayActivity.StartTime.Value.ToTimeSpan())
                : a.BookingActivityReservation?.StartTime,
            a.TourDayActivity?.EndTime.HasValue == true
                ? a.BookingActivityReservation?.EndTime?.Date.Add(a.TourDayActivity.EndTime.Value.ToTimeSpan())
                : a.BookingActivityReservation?.EndTime,
            null, // FromLocation (would need more includes/joins if required)
            null, // ToLocation
            a.Status,
            a.RejectionReason,
            a.UpdatedAt,
            a.Vehicle?.VehiclePlate,
            a.Vehicle?.VehicleType.ToString()
        )).ToList();

        return new PaginatedList<DriverActivityResponseDto>(total, items, pageNumber, pageSize);
    }
}
