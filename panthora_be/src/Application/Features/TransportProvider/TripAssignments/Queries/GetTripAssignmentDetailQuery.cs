namespace Application.Features.TransportProvider.TripAssignments.Queries;

using Application.Features.TransportProvider.TripAssignments.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;

public sealed record GetTripAssignmentDetailQuery(
    Guid CurrentUserId,
    Guid AssignmentId
) : IQuery<ErrorOr<TripAssignmentDetailDto>>;
