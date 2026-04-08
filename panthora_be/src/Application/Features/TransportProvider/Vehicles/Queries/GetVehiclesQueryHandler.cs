namespace Application.Features.TransportProvider.Vehicles.Queries;

using Application.Common.Constant;
using Application.Features.TransportProvider.Vehicles.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using MediatR;

public sealed class GetVehiclesQueryHandler(
        IVehicleRepository vehicleRepository)
    : IRequestHandler<GetVehiclesQuery, ErrorOr<List<VehicleResponseDto>>>
{
    public async Task<ErrorOr<List<VehicleResponseDto>>> Handle(
        GetVehiclesQuery request,
        CancellationToken cancellationToken)
    {
        var vehicles = await vehicleRepository.FindAllByOwnerIdAsync(
            request.CurrentUserId, request.LocationArea, cancellationToken);

        return vehicles.Select(MapToDto).ToList();
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

public sealed class GetVehicleByPlateQueryHandler(
        IVehicleRepository vehicleRepository)
    : IRequestHandler<GetVehicleByPlateQuery, ErrorOr<VehicleResponseDto>>
{
    public async Task<ErrorOr<VehicleResponseDto>> Handle(
        GetVehicleByPlateQuery request,
        CancellationToken cancellationToken)
    {
        var vehicle = await vehicleRepository.FindByPlateAndOwnerIdAsync(
            request.VehiclePlate, request.CurrentUserId, cancellationToken);

        if (vehicle is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, "Resource not found.");

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

public sealed class GetAllVehiclesQueryHandler(
        IVehicleRepository vehicleRepository)
    : IRequestHandler<GetAllVehiclesQuery, ErrorOr<List<VehicleResponseDto>>>
{
    public async Task<ErrorOr<List<VehicleResponseDto>>> Handle(
        GetAllVehiclesQuery request,
        CancellationToken cancellationToken)
    {
        var vehicles = await vehicleRepository.FindAllAsync(
            request.SearchText, request.PageNumber, request.PageSize, cancellationToken);

        return vehicles.Select(MapToDto).ToList();
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
