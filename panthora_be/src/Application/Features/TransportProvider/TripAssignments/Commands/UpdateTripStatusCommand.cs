namespace Application.Features.TransportProvider.TripAssignments.Commands;

using Application.Features.TransportProvider.TripAssignments.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;

public sealed record UpdateTripStatusCommand(
    Guid CurrentUserId,
    Guid AssignmentId,
    UpdateTripStatusRequestDto Request
) : ICommand<ErrorOr<TripAssignmentDetailDto>>;
