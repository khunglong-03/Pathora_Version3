using Application.Features.TransportProvider.Vehicles.DTOs;
using Application.Features.TransportProvider.Vehicles.Validators;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;

namespace Application.Features.Admin.Commands.ManageTransportVehicles;
public sealed record AdminUpdateVehicleCommand(
    [property: JsonPropertyName("adminId")] Guid AdminId,
    [property: JsonPropertyName("providerUserId")] Guid ProviderUserId,
    [property: JsonPropertyName("vehicleId")] Guid VehicleId,
    [property: JsonPropertyName("request")] UpdateVehicleRequestDto Request) : ICommand<ErrorOr<VehicleResponseDto>>;


public sealed class AdminUpdateVehicleCommandHandler(
    IVehicleRepository vehicleRepository,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    ILogger<AdminUpdateVehicleCommandHandler> logger)
    : IRequestHandler<AdminUpdateVehicleCommand, ErrorOr<VehicleResponseDto>>
{
    public async Task<ErrorOr<VehicleResponseDto>> Handle(
        AdminUpdateVehicleCommand request,
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
            "Admin {AdminId} is updating vehicle {VehicleId} for Provider {ProviderId}",
            request.AdminId, request.VehicleId, request.ProviderUserId);

        vehicle.Update(
            (VehicleType)request.Request.VehicleType,
            request.Request.Brand,
            request.Request.Model,
            request.Request.SeatCapacity,
            request.Request.LocationArea.HasValue ? (Continent)request.Request.LocationArea.Value : null,
            request.Request.OperatingCountries,
            request.Request.VehicleImageUrls is { Count: > 0 }
                ? System.Text.Json.JsonSerializer.Serialize(request.Request.VehicleImageUrls)
                : null,
            request.Request.Notes,
            request.AdminId.ToString(),
            request.Request.Quantity);

        vehicleRepository.Update(vehicle);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return MapToDto(vehicle);
    }

    private static VehicleResponseDto MapToDto(VehicleEntity v)
    {
        List<string>? imageUrls = null;
        if (!string.IsNullOrEmpty(v.VehicleImageUrls))
        {
            try
            {
                imageUrls = System.Text.Json.JsonSerializer.Deserialize<List<string>>(v.VehicleImageUrls);
            }
            catch { /* ignore */ }
        }

        return new VehicleResponseDto(
            v.Id,
            v.VehicleType.ToString(),
            v.Brand,
            v.Model,
            v.SeatCapacity,
            v.Quantity,
            v.LocationArea?.ToString(),
            v.OperatingCountries,
            imageUrls,
            v.IsActive,
            v.IsDeleted,
            v.Notes,
            v.CreatedOnUtc);
    }
}


public sealed class AdminUpdateVehicleCommandValidator : AbstractValidator<AdminUpdateVehicleCommand>
{
    public AdminUpdateVehicleCommandValidator()
    {
        RuleFor(x => x.AdminId).NotEmpty();
        RuleFor(x => x.ProviderUserId).NotEmpty();
        RuleFor(x => x.VehicleId).NotEmpty();
        RuleFor(x => x.Request).SetValidator(new UpdateVehicleRequestDtoValidator());
    }
}
