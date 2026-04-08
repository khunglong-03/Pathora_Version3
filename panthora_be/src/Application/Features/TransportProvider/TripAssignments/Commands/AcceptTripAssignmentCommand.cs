namespace Application.Features.TransportProvider.TripAssignments.Commands;

using Application.Features.TransportProvider.TripAssignments.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;

public sealed record AcceptTripAssignmentCommand(
    Guid CurrentUserId,
    Guid AssignmentId,
    AcceptTripAssignmentRequestDto Request
) : ICommand<ErrorOr<TripAssignmentDetailDto>>;
