namespace Application.Features.Admin.Commands.ManageTransportVehicles;

using BuildingBlocks.CORS;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed record AdminDeleteVehicleCommand(
    Guid AdminId,
    Guid ProviderUserId,
    string Plate
) : ICommand<ErrorOr<Success>>;
