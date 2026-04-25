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
public sealed record AdminCreateVehicleCommand(
    [property: JsonPropertyName("adminId")] Guid AdminId,
    [property: JsonPropertyName("providerUserId")] Guid ProviderUserId,
    [property: JsonPropertyName("request")] CreateVehicleRequestDto Request) : ICommand<ErrorOr<VehicleResponseDto>>;


public sealed class AdminCreateVehicleCommandHandler(
    IVehicleRepository vehicleRepository,
    IUserRepository userRepository,
    ISupplierRepository supplierRepository,
    IUnitOfWork unitOfWork,
    ILogger<AdminCreateVehicleCommandHandler> logger)
    : IRequestHandler<AdminCreateVehicleCommand, ErrorOr<VehicleResponseDto>>
{
    public async Task<ErrorOr<VehicleResponseDto>> Handle(
        AdminCreateVehicleCommand request,
        CancellationToken cancellationToken)
    {
        // 2.6 Ensure target provider is not soft-deleted
        var user = await userRepository.FindById(request.ProviderUserId, cancellationToken);
        if (user == null || user.IsDeleted)
        {
            return Error.NotFound("Admin.ProviderNotFound", "Target transport provider not found or deleted.");
        }

        // 2.3 Guard validation: target user must be TransportProvider and linked to valid transport supplier ownership
        var transportProvider = await userRepository.FindTransportProviderByIdAsync(request.ProviderUserId, cancellationToken);
        if (transportProvider == null)
        {
            return Error.Validation("Admin.InvalidTargetRole", "Target user must have the TransportProvider role.");
        }

        var suppliers = await supplierRepository.FindAllTransportProvidersAsync(cancellationToken);
        var hasSupplier = suppliers.Any(s => s.OwnerUserId == request.ProviderUserId);
        if (!hasSupplier)
        {
            return Error.Validation("Admin.NoSupplierOwnership", "Target transport provider does not own any transport supplier profile.");
        }

        // 2.9 Structured logging for admin-on-behalf mutation
        logger.LogInformation(
            "Admin {AdminId} is creating vehicle for Provider {ProviderId}",
            request.AdminId, request.ProviderUserId);

        var vehicle = VehicleEntity.Create(
            (VehicleType)request.Request.VehicleType,
            request.Request.SeatCapacity,
            request.ProviderUserId, // Owner
            request.AdminId.ToString(), // PerformedBy (Actor)
            request.Request.Brand,
            request.Request.Model,
            request.Request.LocationArea.HasValue ? (Continent)request.Request.LocationArea.Value : null,
            request.Request.OperatingCountries,
            request.Request.VehicleImageUrls is { Count: > 0 }
                ? System.Text.Json.JsonSerializer.Serialize(request.Request.VehicleImageUrls)
                : null,
            request.Request.Notes,
            request.Request.Quantity);

        await vehicleRepository.AddAsync(vehicle);
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


public sealed class AdminCreateVehicleCommandValidator : AbstractValidator<AdminCreateVehicleCommand>
{
    public AdminCreateVehicleCommandValidator(IVehicleRepository vehicleRepository)
    {
        RuleFor(x => x.AdminId).NotEmpty();
        RuleFor(x => x.ProviderUserId).NotEmpty();
        RuleFor(x => x.Request).SetValidator(new CreateVehicleRequestDtoValidator(vehicleRepository));
    }
}
