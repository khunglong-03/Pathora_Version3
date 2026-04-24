namespace Application.Features.TransportProvider.TripAssignments.Commands;

using Application.Features.TransportProvider.TripAssignments.DTOs;
using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record RejectTripAssignmentCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("assignmentId")] Guid AssignmentId,
    [property: JsonPropertyName("request")] RejectTripAssignmentRequestDto Request) : ICommand<ErrorOr<TripAssignmentDetailDto>>;
