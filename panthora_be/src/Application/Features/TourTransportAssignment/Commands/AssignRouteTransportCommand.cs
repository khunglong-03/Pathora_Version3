using Application.Common.Constant;
using Application.Features.TourTransportAssignment.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using ErrorOr;
using MediatR;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;

namespace Application.Features.TourTransportAssignment.Commands;

public sealed record AssignRouteTransportCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("request")] RouteTransportAssignmentRequestDto Request) : ICommand<ErrorOr<Success>>;


public sealed class AssignRouteTransportCommandHandler(
        ITourDayActivityRouteTransportRepository routeTransportRepository,
        IVehicleRepository vehicleRepository,
        IDriverRepository driverRepository)
    : IRequestHandler<AssignRouteTransportCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        AssignRouteTransportCommand request,
        CancellationToken cancellationToken)
    {
        // Load vehicle once if VehicleId is provided
        VehicleEntity? vehicle = null;
        if (request.Request.VehicleId.HasValue)
            vehicle = await vehicleRepository.GetByIdAsync(request.Request.VehicleId.Value);

        // Validate same-owner rule: driver and vehicle must belong to same TransportProvider
        if (request.Request.DriverId.HasValue && vehicle is not null)
        {
            var driver = await driverRepository.FindByIdAsync(request.Request.DriverId.Value, cancellationToken);
            if (driver is not null && driver.UserId != vehicle.OwnerId)
                return Error.Validation("Transport.OwnerMismatch", "Driver and vehicle must belong to the same TransportProvider.");
        }

        // Validate continent match: vehicle's LocationArea must match tour's Continent
        if (vehicle is not null)
        {
            var tourContinent = await routeTransportRepository.GetTourContinentByActivityIdAsync(
                request.Request.TourDayActivityId, cancellationToken);

            if (tourContinent.HasValue && vehicle.LocationArea.HasValue
                && vehicle.LocationArea.Value != tourContinent.Value)
            {
                return Error.Validation(
                    "Transport.ContinentMismatch",
                    $"Vehicle's location area ({vehicle.LocationArea}) does not match the tour's continent ({tourContinent}).");
            }
        }

        var entity = TourDayActivityRouteTransportEntity.Create(
            request.Request.BookingActivityReservationId,
            request.Request.TourDayActivityId,
            request.Request.DriverId,
            request.Request.VehicleId,
            request.CurrentUserId,
            request.CurrentUserId.ToString());

        await routeTransportRepository.UpsertAsync(entity, cancellationToken);
        return Result.Success;
    }
}
