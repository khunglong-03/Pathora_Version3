namespace Application.Features.Admin.Commands.ManageTransportVehicles;

using Application.Features.TransportProvider.Vehicles.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed record AdminUpdateVehicleCommand(
    Guid AdminId,
    Guid ProviderUserId,
    string Plate,
    UpdateVehicleRequestDto Request
) : ICommand<ErrorOr<VehicleResponseDto>>;
