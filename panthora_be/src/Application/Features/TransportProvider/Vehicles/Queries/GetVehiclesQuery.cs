namespace Application.Features.TransportProvider.Vehicles.Queries;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TransportProvider.Vehicles.DTOs;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetVehiclesQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("locationArea")] Continent? LocationArea) : IQuery<ErrorOr<List<VehicleResponseDto>>>;

public sealed record GetVehicleByPlateQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("vehiclePlate")] string VehiclePlate) : IQuery<ErrorOr<VehicleResponseDto>>;

public sealed record GetAllVehiclesQuery(
    [property: JsonPropertyName("searchText")] string? SearchText,
    [property: JsonPropertyName("pageNumber")] int PageNumber,
    [property: JsonPropertyName("pageSize")] int PageSize) : IQuery<ErrorOr<List<VehicleResponseDto>>>;
