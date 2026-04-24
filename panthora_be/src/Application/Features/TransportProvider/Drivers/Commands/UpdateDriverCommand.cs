namespace Application.Features.TransportProvider.Drivers.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TransportProvider.Drivers.DTOs;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record UpdateDriverCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("driverId")] Guid DriverId,
    [property: JsonPropertyName("request")] UpdateDriverRequestDto Request) : ICommand<ErrorOr<DriverResponseDto>>;
