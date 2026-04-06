namespace Application.Features.TransportProvider.Drivers.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;

public sealed record DeleteDriverCommand(
    Guid CurrentUserId,
    Guid DriverId
) : ICommand<ErrorOr<Success>>;
