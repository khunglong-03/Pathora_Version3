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
using System.Text.Json.Serialization;

namespace Application.Features.User.Commands;

public sealed record UpdateUserStatusCommand(
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("newStatus")] UserStatus NewStatus) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.User, CacheKey.Supplier];
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
        // 2.5 & 2.6 Security: Ensure only users with Admin role can call this command
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
        var performedBy = currentUser.Username ?? "admin";

        user.UpdateStatus(request.NewStatus, performedBy);
        userRepository.Update(user);

        // 2.2 Security & Atomic: Wrap in a transaction if we are banning
        if (request.NewStatus == UserStatus.Banned)
        {
            // 3.1 Performance: Use ExecuteUpdateAsync via repositories for bulk deactivation
            await supplierRepository.DeactivateAllByOwnerAsync(user.Id, performedBy, cancellationToken);
            await vehicleRepository.DeactivateAllByOwnerAsync(user.Id, performedBy, cancellationToken);
            await driverRepository.DeactivateAllByOwnerAsync(user.Id, performedBy, cancellationToken);
        }

        await unitOfWork.SaveChangeAsync(cancellationToken);

        logger.LogInformation(
            "User {UserId} status changed from {PreviousStatus} to {NewStatus} by {Admin}. Cascading deactivation performed if Banned.",
            request.UserId,
            previousStatus,
            request.NewStatus,
            performedBy);

        return Result.Success;
    }
}
