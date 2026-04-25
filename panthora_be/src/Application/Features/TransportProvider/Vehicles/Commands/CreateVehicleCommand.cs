using Application.Common.Constant;
using Application.Features.TransportProvider.Vehicles.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using MediatR;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;

namespace Application.Features.TransportProvider.Vehicles.Commands;
public sealed record CreateVehicleCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("request")] CreateVehicleRequestDto Request) : ICommand<ErrorOr<VehicleResponseDto>>;


public sealed class CreateVehicleCommandHandler(
        IVehicleRepository vehicleRepository,
        IUnitOfWork unitOfWork)
    : IRequestHandler<CreateVehicleCommand, ErrorOr<VehicleResponseDto>>
{
    public async Task<ErrorOr<VehicleResponseDto>> Handle(
        CreateVehicleCommand request,
        CancellationToken cancellationToken)
    {
        var vehicle = VehicleEntity.Create(
            request.Request.VehiclePlate,
            (VehicleType)request.Request.VehicleType,
            request.Request.SeatCapacity,
            request.CurrentUserId,
            request.CurrentUserId.ToString(),
            request.Request.Brand,
            request.Request.Model,
            request.Request.LocationArea.HasValue
                ? (Continent)request.Request.LocationArea.Value
                : null,
            request.Request.OperatingCountries,
            request.Request.VehicleImageUrls is { Count: > 0 }
                ? System.Text.Json.JsonSerializer.Serialize(request.Request.VehicleImageUrls)
                : null,
            request.Request.Notes);

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
            v.VehiclePlate,
            v.VehicleType.ToString(),
            v.Brand,
            v.Model,
            v.SeatCapacity,
            v.LocationArea?.ToString(),
            v.OperatingCountries,
            imageUrls,
            v.IsActive,
            v.Notes,
            v.CreatedOnUtc);
    }
}
