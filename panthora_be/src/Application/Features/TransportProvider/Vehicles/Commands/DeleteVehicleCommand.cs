namespace Application.Features.TransportProvider.Vehicles.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;

public sealed record DeleteVehicleCommand(
    Guid CurrentUserId,
    string VehiclePlate
) : ICommand<ErrorOr<Success>>;
