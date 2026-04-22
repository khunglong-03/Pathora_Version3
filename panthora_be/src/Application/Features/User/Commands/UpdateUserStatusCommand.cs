using System.Linq;
using Application.Common;
using Application.Common.Constant;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Logging;

namespace Application.Features.User.Commands;

public sealed record UpdateUserStatusCommand(
    Guid UserId,
    UserStatus NewStatus) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.User];
}

public sealed class UpdateUserStatusCommandHandler(
    IUserRepository userRepository,
    ISupplierRepository supplierRepository,
    IVehicleRepository vehicleRepository,
    IDriverRepository driverRepository,
    IUnitOfWork unitOfWork,
    IUser currentUser,
    ILogger<UpdateUserStatusCommandHandler> logger)
    : ICommandHandler<UpdateUserStatusCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        UpdateUserStatusCommand request,
        CancellationToken cancellationToken)
    {
        // 2.5 Security: Ensure only users with Admin role can call this command
        if (!currentUser.Roles.Contains(RoleConstants.Admin))
        {
            return Error.Forbidden("User.Forbidden", "Only administrators can change user status.");
        }

        var user = await userRepository.FindById(request.UserId, cancellationToken);
        if (user is null)
        {
            return Error.NotFound("User.NotFound", $"User with ID '{request.UserId}' was not found.");
        }

        if (user.Id.ToString() == currentUser.Id)
        {
            return Error.Validation("User.SelfBan", "You cannot change your own status.");
        }

        var previousStatus = user.Status;
        user.UpdateStatus(request.NewStatus, currentUser.Username ?? "admin");

        userRepository.Update(user);

        // 2.2 - 2.4 Cascading: Deactivate assets if user is banned
        if (request.NewStatus == UserStatus.Banned)
        {
            var performedBy = currentUser.Username ?? "admin";

            // Deactivate Suppliers
            var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(user.Id, cancellationToken);
            foreach (var supplier in suppliers)
            {
                supplier.Deactivate(performedBy);
                supplierRepository.Update(supplier);
            }

            // Deactivate Vehicles
            var vehicles = await vehicleRepository.FindAllByOwnerIdAsync(user.Id, cancellationToken);
            foreach (var vehicle in vehicles)
            {
                vehicle.Deactivate(performedBy);
                vehicleRepository.Update(vehicle);
            }

            // Deactivate Drivers
            var drivers = await driverRepository.FindAllByUserIdAsync(user.Id, cancellationToken);
            foreach (var driver in drivers)
            {
                driver.Deactivate(performedBy);
                await driverRepository.UpdateAsync(driver, cancellationToken);
            }
        }

        await unitOfWork.SaveChangeAsync(cancellationToken);

        logger.LogInformation(
            "User {UserId} status changed from {PreviousStatus} to {NewStatus} by {Admin}",
            request.UserId,
            previousStatus,
            request.NewStatus,
            currentUser.Username);

        return Result.Success;
    }
}
