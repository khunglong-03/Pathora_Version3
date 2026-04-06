namespace Application.Features.TourTransportAssignment.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TourTransportAssignment.DTOs;
using ErrorOr;

public sealed record AssignRouteTransportCommand(
    Guid CurrentUserId,
    RouteTransportAssignmentRequestDto Request
) : ICommand<ErrorOr<Success>>;
