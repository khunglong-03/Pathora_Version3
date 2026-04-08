namespace Application.Features.TransportProvider.Vehicles.Commands;

using Application.Common.Constant;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;

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
