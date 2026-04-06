namespace Application.Features.TransportProvider.Vehicles.Queries;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TransportProvider.Vehicles.DTOs;
using Domain.Enums;
using ErrorOr;

public sealed record GetVehiclesQuery(
    Guid CurrentUserId,
    Continent? LocationArea
) : IQuery<ErrorOr<List<VehicleResponseDto>>>;

public sealed record GetVehicleByPlateQuery(
    Guid CurrentUserId,
    string VehiclePlate
) : IQuery<ErrorOr<VehicleResponseDto>>;

public sealed record GetAllVehiclesQuery(
    string? SearchText,
    int PageNumber,
    int PageSize
) : IQuery<ErrorOr<List<VehicleResponseDto>>>;
