namespace Application.Features.TourTransportAssignment.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TourTransportAssignment.DTOs;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record AssignRouteTransportCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("request")] RouteTransportAssignmentRequestDto Request) : ICommand<ErrorOr<Success>>;
