using Application.Common.Constant;
using Application.Features.TransportProvider.Vehicles.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using MediatR;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using global::Contracts;

namespace Application.Features.TransportProvider.Vehicles.Queries;
public sealed record GetVehiclesQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("locationArea")] Continent? LocationArea = null,
    [property: JsonPropertyName("isActive")] bool? IsActive = null,
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 50) : IQuery<ErrorOr<PaginatedList<VehicleResponseDto>>>;

public sealed record GetVehicleByPlateQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("vehiclePlate")] string VehiclePlate) : IQuery<ErrorOr<VehicleResponseDto>>;

public sealed record GetAllVehiclesQuery(
    [property: JsonPropertyName("searchText")] string? SearchText,
    [property: JsonPropertyName("pageNumber")] int PageNumber,
    [property: JsonPropertyName("pageSize")] int PageSize) : IQuery<ErrorOr<List<VehicleResponseDto>>>;



public sealed class GetVehiclesQueryHandler(
        IVehicleRepository vehicleRepository)
    : IRequestHandler<GetVehiclesQuery, ErrorOr<PaginatedList<VehicleResponseDto>>>
{
    public async Task<ErrorOr<PaginatedList<VehicleResponseDto>>> Handle(
        GetVehiclesQuery request,
        CancellationToken cancellationToken)
    {
        var total = await vehicleRepository.CountAllByOwnerIdAsync(request.CurrentUserId, request.IsActive, request.LocationArea, cancellationToken);
        var vehicles = await vehicleRepository.FindAllByOwnerIdPaginatedAsync(
            request.CurrentUserId, request.PageNumber, request.PageSize, request.IsActive, request.LocationArea, cancellationToken);

        var items = vehicles.Select(MapToDto).ToList();
        return new PaginatedList<VehicleResponseDto>(total, items, request.PageNumber, request.PageSize);
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
