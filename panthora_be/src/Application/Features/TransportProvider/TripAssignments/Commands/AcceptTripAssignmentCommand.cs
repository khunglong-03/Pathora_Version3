using Application.Common.Constant;
using Application.Features.TransportProvider.TripAssignments.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;

namespace Application.Features.TransportProvider.TripAssignments.Commands;
public sealed record AcceptTripAssignmentCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("assignmentId")] Guid AssignmentId,
    [property: JsonPropertyName("request")] AcceptTripAssignmentRequestDto Request) : ICommand<ErrorOr<TripAssignmentDetailDto>>;


public sealed class AcceptTripAssignmentCommandHandler(
        ITourDayActivityRouteTransportRepository repository,
        IUnitOfWork unitOfWork)
    : ICommandHandler<AcceptTripAssignmentCommand, ErrorOr<TripAssignmentDetailDto>>
{
    public async Task<ErrorOr<TripAssignmentDetailDto>> Handle(
        AcceptTripAssignmentCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.FindByIdWithDetailsAsync(request.AssignmentId, cancellationToken);

        if (entity is null)
            return Error.NotFound(ErrorConstants.Common.ConcurrencyConflictCode, "Resource not found.");

        var vehicleOwner = entity.Vehicle?.OwnerId;
        var driverUser = entity.Driver?.UserId;
        if (vehicleOwner != request.CurrentUserId && driverUser != request.CurrentUserId)
            return Error.NotFound(ErrorConstants.Common.ConcurrencyConflictCode, "Resource not found.");

        entity.Accept(request.CurrentUserId.ToString());

        repository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return MapToDto(entity);
    }

    private static TripAssignmentDetailDto MapToDto(Domain.Entities.TourDayActivityRouteTransportEntity entity)
    {
        var booking = entity.BookingActivityReservation;
        var route = entity.TourDayActivity;

        return new TripAssignmentDetailDto(
            entity.Id,
            booking.BookingId.ToString(),
            route.TransportationName ?? route.TransportationType?.ToString() ?? string.Empty,
            booking.StartTime,
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
