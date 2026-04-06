namespace Application.Features.TransportProvider.Drivers.Queries;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TransportProvider.Drivers.DTOs;
using ErrorOr;

public sealed record GetDriversQuery(Guid CurrentUserId)
    : IQuery<ErrorOr<List<DriverResponseDto>>>;

public sealed record GetDriverByIdQuery(
    Guid CurrentUserId,
    Guid DriverId
) : IQuery<ErrorOr<DriverResponseDto>>;
