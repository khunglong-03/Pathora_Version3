namespace Application.Features.TransportProvider.Drivers.Queries;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TransportProvider.Drivers.DTOs;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetDriversQuery([property: JsonPropertyName("currentUserId")] Guid CurrentUserId)
    : IQuery<ErrorOr<List<DriverResponseDto>>>;

public sealed record GetDriverByIdQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("driverId")] Guid DriverId) : IQuery<ErrorOr<DriverResponseDto>>;
