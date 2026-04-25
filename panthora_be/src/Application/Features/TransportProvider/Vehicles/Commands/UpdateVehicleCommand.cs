using Application.Common.Constant;
using Application.Features.TransportProvider.Vehicles.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using MediatR;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;

namespace Application.Features.TransportProvider.Vehicles.Commands;
public sealed record UpdateVehicleCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("vehicleId")] Guid VehicleId,
    [property: JsonPropertyName("request")] UpdateVehicleRequestDto Request) : ICommand<ErrorOr<VehicleResponseDto>>;


public sealed class UpdateVehicleCommandHandler(
        IVehicleRepository vehicleRepository,
        IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateVehicleCommand, ErrorOr<VehicleResponseDto>>
{
    public async Task<ErrorOr<VehicleResponseDto>> Handle(
        UpdateVehicleCommand request,
        CancellationToken cancellationToken)
    {
        var vehicle = await vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);

        if (vehicle is null || vehicle.OwnerId != request.CurrentUserId)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, "Resource not found.");

        vehicle.Update(
            (VehicleType)request.Request.VehicleType,
            request.Request.Brand,
            request.Request.Model,
            request.Request.SeatCapacity,
            request.Request.LocationArea.HasValue
                ? (Continent)request.Request.LocationArea.Value
                : null,
            request.Request.OperatingCountries,
            request.Request.VehicleImageUrls is { Count: > 0 }
                ? System.Text.Json.JsonSerializer.Serialize(request.Request.VehicleImageUrls)
                : vehicle.VehicleImageUrls,
            request.Request.Notes,
            request.CurrentUserId.ToString(),
            request.Request.Quantity);

        vehicleRepository.Update(vehicle);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return MapToDto(vehicle);
    }

    private static VehicleResponseDto MapToDto(Domain.Entities.VehicleEntity v)
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
