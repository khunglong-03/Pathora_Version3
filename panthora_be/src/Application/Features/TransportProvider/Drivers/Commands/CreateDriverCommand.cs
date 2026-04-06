namespace Application.Features.TransportProvider.Drivers.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TransportProvider.Drivers.DTOs;
using ErrorOr;

public sealed record CreateDriverCommand(
    Guid CurrentUserId,
    CreateDriverRequestDto Request
) : ICommand<ErrorOr<DriverResponseDto>>;
