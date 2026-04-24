namespace Application.Features.Admin.Commands.ManageTransportVehicles;

using Application.Features.TransportProvider.Vehicles.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;

public sealed record AdminUpdateVehicleCommand(
    [property: JsonPropertyName("adminId")] Guid AdminId,
    [property: JsonPropertyName("providerUserId")] Guid ProviderUserId,
    [property: JsonPropertyName("plate")] string Plate,
    [property: JsonPropertyName("request")] UpdateVehicleRequestDto Request) : ICommand<ErrorOr<VehicleResponseDto>>;
