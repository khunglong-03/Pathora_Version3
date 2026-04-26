using Application.Features.TransportProvider.TripAssignments.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;

namespace Application.Features.TransportProvider.TripAssignments.Queries;

public sealed record GetTripAssignmentsQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("statusFilter")] int? StatusFilter) : IQuery<ErrorOr<List<TripAssignmentListDto>>>;


public sealed class GetTripAssignmentsQueryHandler(
        ITourDayActivityRouteTransportRepository repository)
    : IQueryHandler<GetTripAssignmentsQuery, ErrorOr<List<TripAssignmentListDto>>>
{
    public async Task<ErrorOr<List<TripAssignmentListDto>>> Handle(
        GetTripAssignmentsQuery request,
        CancellationToken cancellationToken)
    {
        var assignments = await repository.FindByOwnerIdAsync(
            request.CurrentUserId,
            request.StatusFilter,
            cancellationToken);

        return assignments.Select(MapToDto).ToList();
    }

    private static TripAssignmentListDto MapToDto(Domain.Entities.TourDayActivityRouteTransportEntity entity)
    {
        var booking = entity.BookingActivityReservation;
        var route = entity.TourDayActivity;

        return new TripAssignmentListDto(
            entity.Id,
            booking.BookingId.ToString(),
            route.TransportationName ?? route.TransportationType?.ToString() ?? string.Empty,
            booking.StartTime,
            entity.Vehicle?.VehicleType.ToString(),
            entity.Driver?.FullName,
            StatusToText(entity.Status ?? 0),
            StatusToText(entity.Status ?? 0)
        );
    }

    private static string StatusToText(int status) => status switch
    {
        0 => "Pending",
        1 => "InProgress",
        2 => "Completed",
        3 => "Rejected",
        4 => "Cancelled",
        _ => "Pending"
    };
}
