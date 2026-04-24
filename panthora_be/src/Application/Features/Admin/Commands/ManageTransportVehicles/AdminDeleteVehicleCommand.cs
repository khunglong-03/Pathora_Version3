namespace Application.Features.Admin.Commands.ManageTransportVehicles;

using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;

public sealed record AdminDeleteVehicleCommand(
    [property: JsonPropertyName("adminId")] Guid AdminId,
    [property: JsonPropertyName("providerUserId")] Guid ProviderUserId,
    [property: JsonPropertyName("plate")] string Plate) : ICommand<ErrorOr<Success>>;
