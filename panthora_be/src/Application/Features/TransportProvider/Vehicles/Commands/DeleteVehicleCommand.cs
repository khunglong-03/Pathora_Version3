namespace Application.Features.TransportProvider.Vehicles.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record DeleteVehicleCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("vehiclePlate")] string VehiclePlate) : ICommand<ErrorOr<Success>>;
