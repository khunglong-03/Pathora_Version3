namespace Application.Features.Admin.Commands.ManageTransportVehicles;

using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using MediatR;
using Microsoft.Extensions.Logging;

public sealed class AdminDeleteVehicleCommandHandler(
    IVehicleRepository vehicleRepository,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    ILogger<AdminDeleteVehicleCommandHandler> logger)
    : IRequestHandler<AdminDeleteVehicleCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        AdminDeleteVehicleCommand request,
        CancellationToken cancellationToken)
    {
        // 2.6 Ensure target provider is not soft-deleted
        var user = await userRepository.FindById(request.ProviderUserId, cancellationToken);
        if (user == null || user.IsDeleted)
        {
            return Error.NotFound("Admin.ProviderNotFound", "Target transport provider not found or deleted.");
        }

        var vehicle = await vehicleRepository.FindByPlateAndOwnerIdAsync(request.Plate, request.ProviderUserId, cancellationToken);
        if (vehicle == null)
        {
            return Error.NotFound("Admin.VehicleNotFound", $"Vehicle with plate '{request.Plate}' not found for this provider.");
        }

        // 2.9 Structured logging
        logger.LogInformation(
            "Admin {AdminId} is deleting vehicle {Plate} for Provider {ProviderId}",
            request.AdminId, request.Plate, request.ProviderUserId);

        await vehicleRepository.SoftDeleteAsync(vehicle.Id, request.AdminId.ToString(), cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}
