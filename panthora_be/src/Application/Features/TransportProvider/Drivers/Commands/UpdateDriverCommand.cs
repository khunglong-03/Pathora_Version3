namespace Application.Features.TransportProvider.Drivers.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TransportProvider.Drivers.DTOs;
using ErrorOr;

public sealed record UpdateDriverCommand(
    Guid CurrentUserId,
    Guid DriverId,
    UpdateDriverRequestDto Request
) : ICommand<ErrorOr<DriverResponseDto>>;
