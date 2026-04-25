using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;

namespace Application.Features.Admin.Commands.ManageTransportVehicles;
public sealed record AdminDeleteVehicleCommand(
    [property: JsonPropertyName("adminId")] Guid AdminId,
    [property: JsonPropertyName("providerUserId")] Guid ProviderUserId,
    [property: JsonPropertyName("vehicleId")] Guid VehicleId) : ICommand<ErrorOr<Success>>;


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

        var vehicle = await vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle == null || vehicle.OwnerId != request.ProviderUserId)
        {
            return Error.NotFound("Admin.VehicleNotFound", $"Vehicle with ID '{request.VehicleId}' not found for this provider.");
        }

        // 2.9 Structured logging
        logger.LogInformation(
            "Admin {AdminId} is deleting vehicle {VehicleId} for Provider {ProviderId}",
            request.AdminId, request.VehicleId, request.ProviderUserId);

        await vehicleRepository.SoftDeleteAsync(vehicle.Id, request.AdminId.ToString(), cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}


public sealed class AdminDeleteVehicleCommandValidator : AbstractValidator<AdminDeleteVehicleCommand>
{
    public AdminDeleteVehicleCommandValidator()
    {
        RuleFor(x => x.AdminId).NotEmpty();
        RuleFor(x => x.ProviderUserId).NotEmpty();
        RuleFor(x => x.VehicleId).NotEmpty();
    }
}
