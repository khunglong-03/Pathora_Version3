using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;

namespace Application.Features.TransportProvider.Vehicles.Commands;
public sealed record DeleteVehicleCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("vehiclePlate")] string VehiclePlate) : ICommand<ErrorOr<Success>>;


public sealed class DeleteVehicleCommandHandler(
        IVehicleRepository vehicleRepository)
    : IRequestHandler<DeleteVehicleCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        DeleteVehicleCommand request,
        CancellationToken cancellationToken)
    {
        var vehicle = await vehicleRepository.FindByPlateAndOwnerIdAsync(
            request.VehiclePlate, request.CurrentUserId, cancellationToken);

        if (vehicle is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, "Resource not found.");

        await vehicleRepository.SoftDeleteAsync(vehicle.Id, request.CurrentUserId.ToString(), cancellationToken);
        return Result.Success;
    }
}
