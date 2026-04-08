namespace Application.Features.TransportProvider.TripAssignments.Commands;

using Application.Common.Constant;
using Application.Features.TransportProvider.TripAssignments.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed class UpdateTripStatusCommandHandler(
        ITourDayActivityRouteTransportRepository repository,
        IUnitOfWork unitOfWork)
    : ICommandHandler<UpdateTripStatusCommand, ErrorOr<TripAssignmentDetailDto>>
{
    public async Task<ErrorOr<TripAssignmentDetailDto>> Handle(
        UpdateTripStatusCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.FindByIdWithDetailsAsync(request.AssignmentId, cancellationToken);

        if (entity is null)
            return Error.NotFound(ErrorConstants.Common.ConcurrencyConflictCode, "Resource not found.");

        var vehicleOwner = entity.Vehicle?.OwnerId;
        var driverUser = entity.Driver?.UserId;
        if (vehicleOwner != request.CurrentUserId && driverUser != request.CurrentUserId)
            return Error.NotFound(ErrorConstants.Common.ConcurrencyConflictCode, "Resource not found.");

        var performedBy = request.CurrentUserId.ToString();

        switch (request.Request.Status)
        {
            case "Completed":
                entity.Complete(performedBy);
                break;
            case "Cancelled":
                entity.Cancel(performedBy);
                break;
            default:
                return Error.NotFound(ErrorConstants.Common.ConcurrencyConflictCode, "Resource not found.");
        }

        repository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return MapToDto(entity);
    }

    private static TripAssignmentDetailDto MapToDto(Domain.Entities.TourDayActivityRouteTransportEntity entity)
    {
        var booking = entity.BookingActivityReservation;
        var route = entity.TourPlanRoute;

        return new TripAssignmentDetailDto(
            entity.Id,
            booking.BookingId.ToString(),
            route.TransportationName ?? route.TransportationType.ToString(),
            booking.StartTime,
            entity.Vehicle?.VehiclePlate,
            entity.Vehicle?.VehicleType.ToString(),
            entity.Vehicle?.SeatCapacity,
            entity.Driver?.FullName,
            entity.Driver?.PhoneNumber,
            entity.Driver?.LicenseNumber,
            StatusToText(entity.Status ?? 0),
            StatusToText(entity.Status ?? 0),
            entity.RejectionReason,
            null,
            entity.CreatedOnUtc);
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
