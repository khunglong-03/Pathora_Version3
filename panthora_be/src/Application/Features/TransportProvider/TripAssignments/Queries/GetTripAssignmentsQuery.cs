namespace Application.Features.TransportProvider.TripAssignments.Queries;

using Application.Features.TransportProvider.TripAssignments.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetTripAssignmentsQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("statusFilter")] int? StatusFilter) : IQuery<ErrorOr<List<TripAssignmentListDto>>>;
