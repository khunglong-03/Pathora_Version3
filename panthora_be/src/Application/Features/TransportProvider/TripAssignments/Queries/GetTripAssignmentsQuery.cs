namespace Application.Features.TransportProvider.TripAssignments.Queries;

using Application.Features.TransportProvider.TripAssignments.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;

public sealed record GetTripAssignmentsQuery(
    Guid CurrentUserId,
    int? StatusFilter
) : IQuery<ErrorOr<List<TripAssignmentListDto>>>;
