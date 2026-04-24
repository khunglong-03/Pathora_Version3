namespace Application.Features.TransportProvider.TripAssignments.Queries;

using Application.Features.TransportProvider.TripAssignments.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetTripAssignmentDetailQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("assignmentId")] Guid AssignmentId) : IQuery<ErrorOr<TripAssignmentDetailDto>>;
