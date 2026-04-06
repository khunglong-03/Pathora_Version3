namespace Application.Features.TransportProvider.Vehicles.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TransportProvider.Vehicles.DTOs;
using ErrorOr;

public sealed record CreateVehicleCommand(
    Guid CurrentUserId,
    CreateVehicleRequestDto Request
) : ICommand<ErrorOr<VehicleResponseDto>>;
