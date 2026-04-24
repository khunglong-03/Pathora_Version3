namespace Application.Features.TransportProvider.Drivers.Queries;

using Application.Features.TransportProvider.Drivers.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;
using global::Contracts;

public sealed record GetDriverActivitiesQuery(
    [property: JsonPropertyName("providerId")] Guid ProviderId,
    [property: JsonPropertyName("driverId")] Guid DriverId,
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 50)
    : IQuery<ErrorOr<PaginatedList<DriverActivityResponseDto>>>;
