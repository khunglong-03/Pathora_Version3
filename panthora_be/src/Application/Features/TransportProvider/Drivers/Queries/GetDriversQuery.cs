namespace Application.Features.TransportProvider.Drivers.Queries;

using Application.Common.Constant;
using Application.Features.TransportProvider.Drivers.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using global::Contracts;


public sealed record GetDriversQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("isActive")] bool? IsActive = null,
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 50) : IQuery<ErrorOr<PaginatedList<DriverResponseDto>>>;

public sealed record GetDriverByIdQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("driverId")] Guid DriverId) : IQuery<ErrorOr<DriverResponseDto>>;



public sealed class GetDriversQueryHandler(
        IDriverRepository driverRepository)
    : IRequestHandler<GetDriversQuery, ErrorOr<PaginatedList<DriverResponseDto>>>
{
    public async Task<ErrorOr<PaginatedList<DriverResponseDto>>> Handle(
        GetDriversQuery request,
        CancellationToken cancellationToken)
    {
        var total = await driverRepository.CountByOwnerIdAsync(request.CurrentUserId, request.IsActive, cancellationToken);
        var drivers = await driverRepository.FindByOwnerIdPaginatedAsync(
            request.CurrentUserId, request.PageNumber, request.PageSize, request.IsActive, cancellationToken);

        var items = drivers.Select(MapToDto).ToList();
        return new PaginatedList<DriverResponseDto>(total, items, request.PageNumber, request.PageSize);
    }

    private static DriverResponseDto MapToDto(Domain.Entities.DriverEntity d) => new(
        d.Id, d.FullName, d.LicenseNumber, d.LicenseType.ToString(),
        d.PhoneNumber, d.AvatarUrl, d.IsActive, d.Notes, d.CreatedOnUtc);
}

public sealed class GetDriverByIdQueryHandler(
        IDriverRepository driverRepository)
    : IRequestHandler<GetDriverByIdQuery, ErrorOr<DriverResponseDto>>
{
    public async Task<ErrorOr<DriverResponseDto>> Handle(
        GetDriverByIdQuery request,
        CancellationToken cancellationToken)
    {
        var driver = await driverRepository.FindByIdAndUserIdAsync(
            request.DriverId, request.CurrentUserId, cancellationToken);

        if (driver is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, "Resource not found.");

        return MapToDto(driver);
    }

    private static DriverResponseDto MapToDto(Domain.Entities.DriverEntity d) => new(
        d.Id, d.FullName, d.LicenseNumber, d.LicenseType.ToString(),
        d.PhoneNumber, d.AvatarUrl, d.IsActive, d.Notes, d.CreatedOnUtc);
}
