namespace Application.Features.TransportProvider.Vehicles.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TransportProvider.Vehicles.DTOs;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record CreateVehicleCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("request")] CreateVehicleRequestDto Request) : ICommand<ErrorOr<VehicleResponseDto>>;
