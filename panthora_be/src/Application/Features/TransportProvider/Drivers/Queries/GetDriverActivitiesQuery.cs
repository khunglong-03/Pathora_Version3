namespace Application.Features.TransportProvider.Drivers.Queries;

using Application.Features.TransportProvider.Drivers.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using global::Contracts;

public sealed record GetDriverActivitiesQuery(
    Guid ProviderId,
    Guid DriverId,
    int PageNumber = 1,
    int PageSize = 50)
    : IQuery<ErrorOr<PaginatedList<DriverActivityResponseDto>>>;
