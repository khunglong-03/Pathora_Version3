namespace Application.Features.Admin.Commands.ManageTransportVehicles;

using Application.Features.TransportProvider.Vehicles.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed record AdminCreateVehicleCommand(
    Guid AdminId,
    Guid ProviderUserId,
    CreateVehicleRequestDto Request
) : ICommand<ErrorOr<VehicleResponseDto>>;
